const whatsappCloudService = require('../services/whatsappCloudService');
const Member = require('../models/Member');
const MembershipPayment = require('../models/MembershipPayment');
const FinePayment = require('../models/FinePayment');
const Meeting = require('../models/Meeting');

// Helper to normalize and try to find member by incoming number
async function findMemberByIncomingNumber(incoming) {
  if (!incoming) return null;
  let phone = String(incoming).trim();
  // remove any non-digit chars (just in case)
  phone = phone.replace(/[^0-9+]/g, '');
  if (phone.startsWith('+')) phone = phone.substring(1);

  // Try direct match (cloud sends e.g. 94767531659)
  let member = await Member.findOne({ whatsApp: phone }).populate('dependents', 'name relationship dateOfDeath');
  if (member) return member;

  // If starts with 94, try local 0 prefix
  if (phone.startsWith('94')) {
    const local = '0' + phone.substring(2);
    member = await Member.findOne({ whatsApp: local }).populate('dependents', 'name relationship dateOfDeath');
    if (member) return member;
  }

  // If starts with 0, try replace with 94
  if (phone.startsWith('0')) {
    const intl = '94' + phone.substring(1);
    member = await Member.findOne({ whatsApp: intl }).populate('dependents', 'name relationship dateOfDeath');
    if (member) return member;
  }

  return null;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('si-LK', { style: 'currency', currency: 'LKR' }).format(Math.abs(amount) || 0);
}

async function buildBalanceText(member) {
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;
  // Calculate up to LAST month (e.g. if Feb, charge for 1 month: Jan)
  // getMonth() is 0-indexed (Jan=0, Feb=1), so it effectively gives the count of full past months
  const monthsToCharge = new Date().getMonth();
  const startOfYear = new Date(currentYear, 0, 1);

  let membershipCharge = 300 * monthsToCharge;
  if (member.siblingsCount > 0) {
    membershipCharge = (300 * member.siblingsCount * 0.3 + 300) * monthsToCharge;
  }

  const membershipPayments = await MembershipPayment.find({ memberId: member._id, date: { $gte: startOfYear } });
  const totalMembershipPaid = membershipPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const membershipDue = membershipCharge - totalMembershipPaid;

  const fineTotal = member.fines?.reduce((s, f) => s + (f.amount || 0), 0) || 0;
  const finePayments = await FinePayment.find({ memberId: member._id, date: { $gte: startOfYear } });
  const totalFinePaid = finePayments.reduce((s, p) => s + (p.amount || 0), 0);
  const fineDue = fineTotal - totalFinePaid;

  const previousDueVal = member.previousDue || 0;
  const totalOutstanding = membershipDue + fineDue + previousDueVal;

  // Dynamic label for previous due
  const prevDueLabel = previousDueVal < 0 ? `${prevYear} ඉතිරිය` : `${prevYear} හිඟ`;

  // Dynamic label for Total Outstanding
  const totalLabel = totalOutstanding < 0 ? 'මුළු ඉතිරිය' : 'මුළු හිඟ';

  return `👤 ${member.name}\n🆔 සා.අංකය: ${member.member_id}\n\n=== 💰 මුදල් තත්ත්වය ===\n\n💳 සාමාජිකත්ව හිඟ: ${formatCurrency(membershipDue)}\n⚠️ දඩ හිඟ: ${formatCurrency(fineDue)}\n📅 ${prevDueLabel}: ${formatCurrency(previousDueVal)}\n\n━━━━━━━━━━━━━━━\n💵 ${totalLabel}: ${formatCurrency(totalOutstanding)}`;
}

async function buildAbsencesText(member) {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const meetings = await Meeting.find({ date: { $gte: startOfYear } }).sort({ date: -1 });

  if (!meetings.length) return `${currentYear} වර්ෂයේ සභා තවම පැවැත්වී නැත.`;

  // Total Absents: Count how many meetings this member is in 'absents' array
  // Meeting.absents stores member_id (Number)
  const totalAbsents = meetings.filter(m => m.absents && m.absents.includes(member.member_id)).length;

  // Consecutive Absents from member document
  const consecutiveAbsents = member.meetingAbsents || 0;

  const attended = meetings.length - totalAbsents;
  const attendanceRate = ((attended / meetings.length) * 100).toFixed(1);

  return `👤 ${member.name}\n🆔 සා.අංකය: ${member.member_id}\n\n=== 📊 ${currentYear} වර්ෂය පැමිණීම ===\n\n📅 සභා සංඛ්‍යාව: ${meetings.length}\n✅ පැමිණි: ${attended}\n❌ නොපැමිණි: ${totalAbsents}\n🔄 එක පෙලට නොපැමිණීම: ${consecutiveAbsents}\n\n━━━━━━━━━━━━━━━\n📈 පැමිණීම: ${attendanceRate}%`;
}

async function buildFamilyText(member) {
  const dependents = member.dependents || [];
  let text = `👤 ${member.name}\n🆔 සා.අංකය: ${member.member_id}\n\n=== 👨‍👩‍👧‍👦 පවුල් විස්තර ===\n\n👫 සහෝදර/සහෝදරියන්: ${member.siblingsCount || 0}`;
  if (!dependents.length) {
    text += '\n\n📝 යැපෙන්නන් නොමැත';
  } else {
    text += `\n\n👥 යැපෙන්නන් (${dependents.length}):\n`;
    dependents.forEach((d, i) => {
      const status = d.dateOfDeath ? ' (මියගිය)' : '';
      text += `   ${i + 1}. ${d.name} - ${d.relationship} ${status}\n`;
    });
  }
  return text;
}

async function buildPaymentsText(member) {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);

  // 1. Membership Payments
  const allMemPayments = await MembershipPayment.find({ memberId: member._id }).sort({ date: -1 });
  const pastMemPayments = allMemPayments.filter(p => new Date(p.date) < startOfYear);
  const curMemPayments = allMemPayments.filter(p => new Date(p.date) >= startOfYear);

  const pastMemTotal = pastMemPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const curMemTotal = curMemPayments.reduce((s, p) => s + (p.amount || 0), 0);

  // 2. Fine/Due Payments
  const allFinePayments = await FinePayment.find({ memberId: member._id }).sort({ date: -1 });
  const pastFinePayments = allFinePayments.filter(p => new Date(p.date) < startOfYear);
  const curFinePayments = allFinePayments.filter(p => new Date(p.date) >= startOfYear);

  const pastFineTotal = pastFinePayments.reduce((s, p) => s + (p.amount || 0), 0);
  const curFineTotal = curFinePayments.reduce((s, p) => s + (p.amount || 0), 0);

  let text = `${member.name}\nසා.අංකය: ${member.member_id}\n\n=== ගෙවීම් විස්තර ===\n`;

  // Section 1: Membership Payments
  text += `\n💰 සාමාජික මුදල්:\n`;

  // Current Year
  if (curMemPayments.length > 0) {
    text += `\n   ${currentYear} වසර:\n`;
    curMemPayments.forEach(p => {
      const d = p.date ? new Date(p.date).toLocaleDateString('si-LK') : '';
      text += `   📅 ${d}: ${formatCurrency(p.amount)}\n`;
    });
    text += `   ➖➖➖➖➖➖➖\n`;
    text += `   එකතුව: ${formatCurrency(curMemTotal)}\n`;
  } else {
    text += `\n   ${currentYear} වසරේ ගෙවීම් නැත\n`;
  }

  // Past Years - Group by year
  if (pastMemPayments.length > 0) {
    // Group payments by year
    const paymentsByYear = {};
    pastMemPayments.forEach(p => {
      const year = p.date ? new Date(p.date).getFullYear() : 'Unknown';
      if (!paymentsByYear[year]) paymentsByYear[year] = [];
      paymentsByYear[year].push(p);
    });

    // Display each year's payments
    Object.keys(paymentsByYear).sort((a, b) => b - a).forEach(year => {
      const yearPayments = paymentsByYear[year];
      const yearTotal = yearPayments.reduce((s, p) => s + (p.amount || 0), 0);
      text += `\n   ${year} වසර:\n`;
      yearPayments.forEach(p => {
        const d = p.date ? new Date(p.date).toLocaleDateString('si-LK') : '';
        text += `   📅 ${d}: ${formatCurrency(p.amount)}\n`;
      });
      text += `   ➖➖➖➖➖➖➖\n`;
      text += `   එකතුව: ${formatCurrency(yearTotal)}\n`;
    });
  }

  // Section 2: Fine/Due Payments
  text += `\n⚠️ දඩ/හිඟ මුදල්:\n`;

  // Current Year
  if (curFinePayments.length > 0) {
    text += `\n   ${currentYear} වසර:\n`;
    curFinePayments.forEach(p => {
      const d = p.date ? new Date(p.date).toLocaleDateString('si-LK') : '';
      text += `   📅 ${d}: ${formatCurrency(p.amount)}\n`;
    });
    text += `   ➖➖➖➖➖➖➖\n`;
    text += `   එකතුව: ${formatCurrency(curFineTotal)}\n`;
  } else {
    text += `\n   ${currentYear} වසරේ ගෙවීම් නැත\n`;
  }

  // Past Years - Group by year
  if (pastFinePayments.length > 0) {
    // Group payments by year
    const paymentsByYear = {};
    pastFinePayments.forEach(p => {
      const year = p.date ? new Date(p.date).getFullYear() : 'Unknown';
      if (!paymentsByYear[year]) paymentsByYear[year] = [];
      paymentsByYear[year].push(p);
    });

    // Display each year's payments
    Object.keys(paymentsByYear).sort((a, b) => b - a).forEach(year => {
      const yearPayments = paymentsByYear[year];
      const yearTotal = yearPayments.reduce((s, p) => s + (p.amount || 0), 0);
      text += `\n   ${year} වසර:\n`;
      yearPayments.forEach(p => {
        const d = p.date ? new Date(p.date).toLocaleDateString('si-LK') : '';
        text += `   📅 ${d}: ${formatCurrency(p.amount)}\n`;
      });
      text += `   ➖➖➖➖➖➖➖\n`;
      text += `   එකතුව: ${formatCurrency(yearTotal)}\n`;
    });
  }



  return text;
}

async function buildFinesText(member) {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);

  // Fines are stored in member.fines array
  const allFines = member.fines || [];

  const pastFines = allFines.filter(f => new Date(f.date) < startOfYear);
  const curFines = allFines.filter(f => new Date(f.date) >= startOfYear);

  const pastTotal = pastFines.reduce((s, f) => s + (f.amount || 0), 0);
  const curTotal = curFines.reduce((s, f) => s + (f.amount || 0), 0);

  let text = `👤 ${member.name}\n🆔 සා.අංකය: ${member.member_id}\n\n=== ⚠️ දඩ විස්තර ===\n`;

  // Current Year Details
  if (curFines.length > 0) {
    text += `\n   ${currentYear} වසර:\n`;
    curFines.forEach(f => {
      const d = f.date ? new Date(f.date).toLocaleDateString('si-LK') : '';
      let type = f.eventType || 'other';
      let reason = 'වෙනත්';
      let emoji = '📌';

      // Mapping eventType to Sinhala labels with emojis
      if (type === 'meeting') { reason = 'සභා රැස්වීම්'; emoji = '📅'; }
      else if (type === 'funeral') { reason = 'අවමංගල්‍ය'; emoji = '⚰️'; }
      else if (type === 'funeral-work') { reason = 'දේහය ගෙනයාම'; emoji = '🚶'; }
      else if (type === 'cemetery-work') { reason = 'පිටියේ වැඩ'; emoji = '⛏️'; }
      else if (type === 'common-work') { reason = 'පොදු වැඩ'; emoji = '🔨'; }
      else if (type === 'extraDue') { reason = 'අමතර දඩ'; emoji = '💰'; }

      text += `   ${emoji} ${d}: ${reason} - ${formatCurrency(f.amount)}\n`;
    });
    text += `   ➖➖➖➖➖➖➖\n`;
    text += `   එකතුව: ${formatCurrency(curTotal)}\n`;
  } else {
    text += `\n   ${currentYear} වසරේ දඩ නැත\n`;
  }

  // Past Years - Group by year
  if (pastFines.length > 0) {
    // Group fines by year
    const finesByYear = {};
    pastFines.forEach(f => {
      const year = f.date ? new Date(f.date).getFullYear() : 'Unknown';
      if (!finesByYear[year]) finesByYear[year] = [];
      finesByYear[year].push(f);
    });

    // Display each year's fines
    Object.keys(finesByYear).sort((a, b) => b - a).forEach(year => {
      const yearFines = finesByYear[year];
      const yearTotal = yearFines.reduce((s, f) => s + (f.amount || 0), 0);
      text += `\n   ${year} වසර:\n`;
      yearFines.forEach(f => {
        const d = f.date ? new Date(f.date).toLocaleDateString('si-LK') : '';
        let type = f.eventType || 'other';
        let reason = 'වෙනත්';
        let emoji = '📌';

        // Mapping eventType to Sinhala labels with emojis
        if (type === 'meeting') { reason = 'සභා රැස්වීම්'; emoji = '📅'; }
        else if (type === 'funeral') { reason = 'අවමංගල්‍ය'; emoji = '⚰️'; }
        else if (type === 'funeral-work') { reason = 'දේහය ගෙනයාම'; emoji = '🚶'; }
        else if (type === 'cemetery-work') { reason = 'පිටියේ වැඩ'; emoji = '⛏️'; }
        else if (type === 'common-work') { reason = 'පොදු වැඩ'; emoji = '🔨'; }
        else if (type === 'extraDue') { reason = 'අමතර දඩ'; emoji = '💰'; }

        text += `   ${emoji} ${d}: ${reason} - ${formatCurrency(f.amount)}\n`;
      });
      text += `   ➖➖➖➖➖➖➖\n`;
      text += `   එකතුව: ${formatCurrency(yearTotal)}\n`;
    });
  }

  return text;
}

exports.verifyWebhook = (req, res) => {
  // Verification endpoint for WhatsApp Cloud (GET)
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    console.log('Webhook Verification:', {
      mode,
      receivedToken: token,
      expectedToken: process.env.WHATSAPP_VERIFY_TOKEN
    });

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      return res.status(200).send(challenge);
    } else {
      console.log('WEBHOOK_VERIFICATION_FAILED: Token mismatch');
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
};

exports.receiveWebhook = async (req, res) => {
  try {
    // Try to verify signature if rawBody available
    const signature = req.headers['x-hub-signature-256'];
    const rawBody = req.rawBody || JSON.stringify(req.body);
    if (whatsappCloudService.appSecret) {
      const ok = whatsappCloudService.verifySignature(rawBody, signature);
      if (!ok) {
        console.warn('Invalid webhook signature');
        return res.sendStatus(403);
      }
    }

    // Respond quickly to acknowledge receipt and prevent retries
    // WhatsApp requires a 200 OK within 3 seconds
    res.sendStatus(200);

    const body = req.body;
    // Process each entry/change
    if (Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (!entry.changes) continue;
        for (const change of entry.changes) {
          const value = change.value || {};
          const messages = value.messages || [];
          if (!messages.length) continue;
          for (const message of messages) {
            // Only handle text messages
            const from = message.from || message['from'] || value.metadata?.phone_number_id;
            const text = (message.text && message.text.body) ? String(message.text.body).trim() : '';
            if (!text || !from) continue;

            const upper = text.toUpperCase();
            // Changed ABSENT -> ATTENDANCE, added 'පැමිණීම'
            // Added PAYMENTS -> ගෙවීම්
            // Added FINES -> දඩ
            const valid = ['BALANCE', 'ශේෂය', 'ATTENDANCE', 'පැමිණීම', 'FAMILY', 'පවුල', 'HELP', 'උදව්', 'PAYMENTS', 'ගෙවීම්', 'FINES', 'FINE', 'දඩ'];
            if (!valid.includes(upper)) {
              // ignore non-command
              continue;
            }

            console.log(`Processing command: ${upper} from ${from}`);

            const member = await findMemberByIncomingNumber(from);
            if (!member) {
              // reply asking to register
              await whatsappCloudService.sendTextMessage(from, 'WhatsApp අංකය අප සමඟ ලියාපදිංචි වී නැත. කරුණාකර ලේකම් හමුවී ලියාපදිංචි වන්න.');
              continue;
            }

            if (upper === 'BALANCE' || upper === 'ශේෂය') {
              const msg = await buildBalanceText(member);
              await whatsappCloudService.sendTextMessage(from, msg);
            } else if (upper === 'ATTENDANCE' || upper === 'පැමිණීම') {
              const msg = await buildAbsencesText(member);
              await whatsappCloudService.sendTextMessage(from, msg);
            } else if (upper === 'FAMILY' || upper === 'පවුල') {
              const msg = await buildFamilyText(member);
              await whatsappCloudService.sendTextMessage(from, msg);
            } else if (upper === 'PAYMENTS' || upper === 'ගෙවීම්') {
              const msg = await buildPaymentsText(member);
              await whatsappCloudService.sendTextMessage(from, msg);
            } else if (upper === 'FINES' || upper === 'FINE' || upper === 'දඩ') {
              const msg = await buildFinesText(member);
              await whatsappCloudService.sendTextMessage(from, msg);
            } else if (upper === 'HELP' || upper === 'උදව්') {
              const help = `🤖 එක්සත් සමිතිය WhatsApp Bot\n\n📋 පහත විධානයන් WhatsApp message ලෙස යොමු කර අදාල විස්තර ලබා ගන්න:\n\n💰 BALANCE හෝ ශේෂය\n   ඔබගේ මුළු හිඟ මුදල, සාමාජිකත්ව හිඟ, දඩ හිඟ සහ පෙර වසරේ ඉතිරිය/හිඟ බලන්න\n\n📊 ATTENDANCE හෝ පැමිණීම\n   මෙම වසරේ සභා පැමිණීමේ විස්තර, එක පෙලට නොපැමිණීම සහ පැමිණීමේ ප්‍රතිශතය බලන්න\n\n💳 PAYMENTS හෝ ගෙවීම්\n   ඔබගේ සාමාජික මුදල් සහ දඩ/හිඟ මුදල් ගෙවීම් විස්තර බලන්න\n\n⚠️ FINES හෝ දඩ\n   ඔබට පනවා ඇති දඩ විස්තර (සභා, අවමංගල්‍ය, පොදු වැඩ ආදිය) බලන්න\n\n👨‍👩‍👧‍👦 FAMILY හෝ පවුල\n   ඔබගේ යැපෙන්නන් සහ සහෝදර/සහෝදරියන් ගණන බලන්න\n\n❓ HELP හෝ උදව්\n   මෙම උදව් පණිවිඩය නැවත බලන්න\n\n📝 සටහන: ඕනෑම විධානයක් ඉංග්‍රීසි හෝ සිංහල භාෂාවෙන් යොමු කළ හැක.`;
              await whatsappCloudService.sendTextMessage(from, help);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    // Note: We already sent 200, so we can't send 500 here. 
    // Logging is the best we can do.
  }
};
