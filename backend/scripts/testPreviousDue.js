require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Member = require('../models/Member');
const MembershipPayment = require('../models/MembershipPayment');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  // Provide a member id in env or pick the first member
  let member = null;
  if (process.env.TEST_MEMBER_ID) {
    member = await Member.findById(process.env.TEST_MEMBER_ID);
  } else {
    member = await Member.findOne();
  }

  if (!member) {
    console.error('No member found in DB to test');
    process.exit(1);
  }

console.log('Using member:', member._id.toString(), 'due2023 before:', member['due2023']);
  
  const testDate = new Date(2023, 5, 1); // June of 2023

  // Create a membership payment for 2023
  const payment = new MembershipPayment({ date: testDate, memberId: member._id, amount: 500 });
  await payment.save();

  // Simulate what createReceipts would do: reduce due2023
  member['due2023'] = (member['due2023'] || 0) - 500;
  await member.save();

  console.log('Payment created and applied to due2023. due2023 now:', member['due2023']);

  // Cleanup test payment
  await MembershipPayment.deleteOne({ _id: payment._id });
  // revert due2023
  member['due2023'] = (member['due2023'] || 0) + 500;
  await member.save();

  console.log('Cleanup done. due2023 restored to:', member['due2023']);

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});