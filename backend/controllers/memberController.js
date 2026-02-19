// const mongoose = require("mongoose");

// Import required modules
const jwt = require("jsonwebtoken"); // For decoding and verifying JWT tokens
const bcrypt = require("bcrypt");
const Member = require("../models/Member"); // Import the Member model
const Dependant = require("../models/Dependent"); // Import the Member model
const { Admin, AdminUser } = require("../models/Admin");
const Loan = require("../models/Loan");
const LoanPrinciplePayment = require("../models/LoanPayment"); // Adjust the path to the Loan model if necessary
const LoanInterestPayment = require("../models/LoanInterestPayment"); // Adjust the path to the Loan model if necessary
const PenaltyIntPayment = require("../models/LoanPenaltyIntPayment");
const MembershipPayment = require("../models/MembershipPayment");
const FinePayment = require("../models/FinePayment");
const Funeral = require("../models/Funeral");
const Meeting = require("../models/Meeting");
const CommonWork = require("../models/CommonWork");
const SystemSettings = require("../models/SystemSettings");

// Environment variable for JWT secret
const JWT_SECRET = process.env.JWT_SECRET;

//getting all info about member and dependents
async function getMembershipDetails(member_id) {
  const member = await Member.findOne({ member_id: member_id })
    .populate("dependents", "name relationship dateOfDeath") // Populate dependents with necessary fields
    .select(
      "_id member_id name dateOfDeath dependents area status siblingsCount due2023 deactivated_at"
    );

  if (!member) {
    return;
  }
  return member;
}

//getting membership rate for a member
async function membershipRateForMember(siblingsCount, monthlyRate) {
  if (siblingsCount > 0) {
    return monthlyRate + monthlyRate * 0.3 * siblingsCount;
  } else {
    return monthlyRate;
  }
}

// Get monthly membership rate for a specific year. Prefer year-specific setting
// e.g. MONTHLY_MEMBERSHIP_RATE_2025. Fallback to generic MONTHLY_MEMBERSHIP_RATE
// and then to 300 if nothing is set.
async function getMonthlyRateForYear(year) {
  try {
    const yearKey = `MONTHLY_MEMBERSHIP_RATE_${year}`;
    let value = await SystemSettings.getSettingValue(yearKey, null);
    if (value === null || value === undefined) {
      value = await SystemSettings.getSettingValue('MONTHLY_MEMBERSHIP_RATE', 300);
    }
    return Number(value) || 500;
  } catch (err) {
    console.error('Error reading monthly rate for year', year, err);
    return 400;
  }
}

//get total membership payments of the year
async function getTotalMembershipPayment(year, _id) {
  const currentYear = new Date(year).getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear + 1, 0, 1);
  const membershipPayments = await MembershipPayment.find({
    memberId: _id,
    date: {
      $gte: startOfYear,
      $lt: endOfYear,
    },
  }).select("date amount");

  // const finePayments = await FinePayment.find({
  //   memberId: _id,
  //   date: {
  //     $gte: startOfYear,
  //     $lt: endOfYear,
  //   },
  // }).select("date amount");
  //getting total membership payments for this year
  const totalMembershipPayments = membershipPayments.reduce(
    (total, payment) => total + payment.amount,
    0 // Initial value for the total
  );
  return totalMembershipPayments;
}

//getting all payments by a member
async function getAllPaymentsByMember(member_Id) {
  // const member_Id = await Member.findOne({ member_id: member_id }).select(
  //   "_id"
  // );
  const membershipPayments = await MembershipPayment.find({
    memberId: member_Id, //id object
  }).select("date amount _id");
  // Combine and group payments by date
  const paymentMap = {};

  membershipPayments.forEach((payment) => {
    const date = new Date(payment.date).toISOString().split("T")[0]; // Normalize date
    if (!paymentMap[date]) {
      paymentMap[date] = {
        date,
        mem_id: null,
        memAmount: 0,
        fine_id: null,
        fineAmount: 0,
      };
    }
    paymentMap[date].mem_id = payment._id;
    paymentMap[date].memAmount += payment.amount || 0;
  });

  // Fetch fine payments
  const finePayments = await FinePayment.find({
    memberId: member_Id, //id object
  }).select("date amount _id");
  finePayments.forEach((payment) => {
    const date = new Date(payment.date).toISOString().split("T")[0]; // Normalize date
    if (!paymentMap[date]) {
      paymentMap[date] = {
        date,
        mem_id: null,
        memAmount: 0,
        fine_id: null,
        fineAmount: 0,
      };
    }
    paymentMap[date].fine_id = payment._id;
    paymentMap[date].fineAmount += payment.amount || 0;
  });

  // Convert the map to an array and sort by date
  const allPayments = Object.values(paymentMap).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  //Process and group payments
  const formattedPayments = allPayments.map((payment) => ({
    ...payment,
    date:
      payment.date !== "Total"
        ? new Date(payment.date).toISOString().split("T")[0].replace(/-/g, "/")
        : "Total",
  }));
  const grouped = formattedPayments.reduce((acc, payment) => {
    if (payment.date === "Total") return acc; // Skip the global total row
    const year = payment.date.split("/")[0]; // Extract the year
    if (!acc[year]) {
      acc[year] = {
        payments: [],
        totals: { memAmount: 0, fineAmount: 0 },
      };
    }

    acc[year].payments.push(payment);

    acc[year].totals.memAmount += payment.memAmount || 0;
    acc[year].totals.fineAmount += payment.fineAmount || 0;

    return acc;
  }, {});

  // Add totals to each year's group
  Object.keys(grouped).forEach((year) => {
    grouped[year].payments.push({
      date: "Total",
      memAmount: grouped[year].totals.memAmount,
      fineAmount: grouped[year].totals.fineAmount,
    });
  });
  return grouped;
}

// getting all fine data of a member
async function getAllFinesOfMember(member_Id) {
  try {
    const memberData = await Member.findById(member_Id).select("fines");
    const memberFines = memberData?.fines || [];

    const finePromises = memberFines.map(async (fine) => {
      const fineType = fine.eventType;
      const fineAmount = fine.amount;

      try {
        let date, fineDetails;

        if (
          fineType === "funeral" ||
          fineType === "funeral-ceremony"
        ) {
          // Skip if eventId is null or invalid
          if (!fine.eventId) {
            console.error(`Missing eventId for fine type: ${fineType}`);
            return null;
          }

          const funeral = await Funeral.findById(fine.eventId)
            .select("date member_id")
            .populate("member_id", "name area");

          if (!funeral) {
            console.error(`Funeral not found for eventId: ${fine.eventId}`);
            return null;
          }

          date = new Date(funeral.date).toISOString().split("T")[0];
          let fineDescription = "";

          if (fineType === "funeral") {
            fineDescription = `${funeral.member_id?.area} ${funeral.member_id?.name} ගේ සාමාජිකත්වය යටතේ අවමංගල්‍ය `;
          } else if (fineType === "funeral-ceremony") {
            fineDescription = `${funeral.member_id?.area} ${funeral.member_id?.name} ගේ සාමාජිකත්වය යටතේ අවමංගල්‍යයට දේහය ගෙන යාම`;
          }

          fineDetails = {
            date,
            fineType: fineDescription,
            fineAmount,
            // name: funeral.member_id?.name || "Unknown",
            // area: funeral.member_id?.area || "Unknown",
          };
        } else if (fineType === "extraDue") {
          // Handle extraDue fines (may or may not have eventId)
          if (fine.eventId) {
            const funeral = await Funeral.findById(fine.eventId)
              .select("date member_id")
              .populate("member_id", "name area");
            
            if (funeral) {
              date = new Date(funeral.date).toISOString().split("T")[0];
              fineDetails = {
                date,
                fineType: `අතිරේක ආධාර හිඟ - ${funeral.member_id?.area} ${funeral.member_id?.name} (අවමංගල්‍යය)`,
                fineAmount,
              };
            } else {
              // Funeral not found, use fine date
              date = fine.date ? new Date(fine.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
              fineDetails = {
                date,
                fineType: "අතිරේක ආධාර හිඟ මුදල (බලප්‍රදේශයෙන් පිට අවමංගල්‍යය)",
                fineAmount,
              };
            }
          } else {
            // No eventId, use fine date
            date = fine.date ? new Date(fine.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
            fineDetails = {
              date,
              fineType: "අතිරේක ආධාර හිඟ මුදල (බලප්‍රදේශයෙන් පිට අවමංගල්‍යය)",
              fineAmount,
            };
          }
        } else if (fineType === "meeting") {
          const meeting = await Meeting.findById(fine.eventId).select("date");

          if (!meeting) {
            console.error(`Meeting not found for eventId: ${fine.eventId}`);
            return null;
          }

          date = new Date(meeting.date).toISOString().split("T")[0];

          fineDetails = {
            date,
            fineType: `දින මහා සභාව වන විට මහා සභා වාර තුනක් නොපැමිණීම. `,
            fineAmount,
          };
        } else if (fineType === "common-work") {
          // Handle common-work fines with eventId lookup
          if (fine.eventId) {
            const commonWork = await CommonWork.findById(fine.eventId)
              .select("date title");
            
            if (commonWork) {
              date = new Date(commonWork.date).toISOString().split("T")[0];
              fineDetails = {
                date,
                fineType: `පොදු වැඩ නොපැමිණීම - ${commonWork.title}`,
                fineAmount,
              };
            } else {
              // CommonWork not found, use fine date
              date = fine.date ? new Date(fine.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
              fineDetails = {
                date,
                fineType: "පොදු වැඩ නොපැමිණීම",
                fineAmount,
              };
            }
          } else {
            // No eventId, use fine date
            date = fine.date ? new Date(fine.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
            fineDetails = {
              date,
              fineType: "පොදු වැඩ නොපැමිණීම",
              fineAmount,
            };
          }
        } else {
          console.error(`Unknown fine type: ${fineType}`);
          return null;
        }
        return fineDetails;
      } catch (err) {
        console.error("Error fetching fine data:", err);
        return null;
      }
    });

    const memberFineData = (await Promise.all(finePromises)).filter(Boolean);

    // Group fines by year
    const groupedFines = memberFineData.reduce((acc, fine) => {
      const year = fine.date.split("-")[0]; // Extract the year
      if (!acc[year]) {
        acc[year] = { fines: [], total: { fineAmount: 0 } };
      }
      acc[year].fines.push(fine);
      acc[year].total.fineAmount += fine.fineAmount;
      return acc;
    }, {});

    // Add total to each year's group
    Object.keys(groupedFines).forEach((year) => {
      groupedFines[year].fines.push({
        date: "",
        fineAmount: groupedFines[year].total.fineAmount,
        fineType: "Total",
      });
    });

    return groupedFines;
  } catch (error) {
    console.error("Error getting all fines:", error);
    return {}; // Return an empty object in case of an error
  }
}
//calculate loan interest
async function interestCalculation(
  loanDate,
  remainingAmount,
  lastIntPaymentDate,
  paymentDate
) {
  if (!loanDate || !remainingAmount || !paymentDate)
    return { int: 0, penInt: 0 };
  const loanDateObj = new Date(loanDate);
  const lastIntPayDateObj = new Date(lastIntPaymentDate || loanDate);
  const currentDate = new Date(paymentDate);
  const monthlyInterestRate = 0.03;
  const loanPeriodMonths = 10;

  let totalMonths =
    (currentDate.getFullYear() - loanDateObj.getFullYear()) * 12 +
    (currentDate.getMonth() - loanDateObj.getMonth());
  //adding one month if loan date is exceed
  if (currentDate.getDate() - loanDateObj.getDate() > 0) {
    totalMonths = totalMonths + 1;
  }
  //getting installment
  let loanInstallment = 0;
  let principleShouldPay = (10000 / 10) * totalMonths;
  let totalPrinciplePaid = 10000 - remainingAmount;
  if (totalPrinciplePaid >= principleShouldPay) {
    loanInstallment = 0;
  }
  else if (totalMonths <= 10) {
    loanInstallment = totalMonths * 1000 - (10000 - remainingAmount);
  } else {
    loanInstallment = remainingAmount;
  }

  let lastPaymentMonths =
    (lastIntPayDateObj.getFullYear() - loanDateObj.getFullYear()) * 12 +
    (lastIntPayDateObj.getMonth() - loanDateObj.getMonth());
  // //adding one month if loan date is exceed
  if (lastIntPayDateObj.getDate() - loanDateObj.getDate() > 0) {
    lastPaymentMonths = lastPaymentMonths + 1;
  }

  const interestUnpaidMonths = Math.max(totalMonths - lastPaymentMonths, 0);
  let penaltyMonths = 0;
  //checking loan is over due
  if (totalMonths > 10) {
    //penalty months
    const dueMonths = totalMonths - loanPeriodMonths;
    //checking if int payment has done before due
    if (interestUnpaidMonths > dueMonths) {
      penaltyMonths = dueMonths;
    } else {
      penaltyMonths = interestUnpaidMonths;
    }
  }
  const interest = remainingAmount * interestUnpaidMonths * monthlyInterestRate;
  const penaltyInterest = remainingAmount * penaltyMonths * monthlyInterestRate;
  return {
    int: Math.round(interest),
    penInt: Math.round(penaltyInterest),
    installment: Math.round(loanInstallment + interest + penaltyInterest),
  };
}

//getting loan info of the member
async function memberLoanInfo(member_Id) {
  const loan = await Loan.findOne({
    memberId: member_Id,
    loanRemainingAmount: { $gt: 0 },
  })
    .populate({
      path: "memberId",
      select: "member_id name mobile",
    })
    .populate({
      path: "guarantor1Id",
      select: "member_id name mobile",
    })
    .populate({
      path: "guarantor2Id",
      select: "member_id name mobile",
    });
  const asGuarantor = await Loan.find({
    loanRemainingAmount: { $gt: 0 },
    $or: [
      { guarantor1Id: member_Id }, // replace with actual member ObjectId
      { guarantor2Id: member_Id },
    ],
  })
    .select("_id memberId loanNumber")
    .populate({ path: "memberId", select: "name" });

  let principlePayments = [];
  let interestPayments = [];
  let penaltyIntPayments = [];
  let lastIntPaymentDate = "";
  let groupedPayments = [];
  let calculatedInterest = {};
  if (loan) {
    principlePayments = await LoanPrinciplePayment.find({
      loanId: loan?._id,
    }).select("date amount");
    interestPayments = await LoanInterestPayment.find({
      loanId: loan?._id,
    }).select("date amount");
    penaltyIntPayments = await PenaltyIntPayment.find({
      loanId: loan?._id,
    }).select("date amount");
    lastIntPaymentDate = await LoanInterestPayment.findOne({
      loanId: loan?._id,
    })
      .sort({ date: -1 })
      .select("date");

    // Helper function to group payments by date
    const groupByDate = (payments) => {
      return payments.reduce((acc, payment) => {
        if (payment.date) {
          const date = new Date(payment.date).toISOString().split("T")[0]; // Format date as YYYY-MM-DD
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(payment);
        }
        return acc;
      }, {});
    };

    // Group payments by date
    const groupedPrinciplePayments = groupByDate(principlePayments);
    const groupedInterestPayments = groupByDate(interestPayments);
    const groupedPenaltyIntPayments = groupByDate(penaltyIntPayments);

    // Combine grouped payments into an array of objects
    const allDates = new Set([
      ...Object.keys(groupedPrinciplePayments),
      ...Object.keys(groupedInterestPayments),
      ...Object.keys(groupedPenaltyIntPayments),
    ]);
    groupedPayments = Array.from(allDates).map((date) => ({
      date,
      principleAmount:
        groupedPrinciplePayments[date]?.reduce(
          (sum, payment) => sum + payment.amount,
          0
        ) || 0,
      interestAmount:
        groupedInterestPayments[date]?.reduce(
          (sum, payment) => sum + payment.amount,
          0
        ) || 0,
      penaltyInterestAmount:
        groupedPenaltyIntPayments[date]?.reduce(
          (sum, payment) => sum + payment.amount,
          0
        ) || 0,
    }));
    calculatedInterest = await interestCalculation(
      loan?.loanDate,
      loan?.loanRemainingAmount,
      lastIntPaymentDate?.date,
      new Date()
    );

  }
  return { loan, groupedPayments, calculatedInterest, asGuarantor };
}

//getting logged member id
async function loggedMemberId(req) {
  try {
    // Step 1: Extract the token from the request headers
    const token = req.headers.authorization?.split(" ")[1]; // Extract "Bearer <token>"

    if (!token) {
      return { error: "Authorization token is missing" };
    }

    // Step 2: Verify and decode the token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET); // Decode the token using the secret
    } catch (error) {
      return { error: "Invalid or expired token" };
    }

    const member = await Member.findOne({ member_id: decoded.member_id });

    // Return null if member not found (admin users won't be in Member collection)
    return member; // This can be null for admin users

  } catch (error) {
    return { error: "Authorization token is missing" };
  }
}
// Get profile information for a member
exports.getProfileInfo = async (req, res) => {
  try {
    // Step 1: Extract the token from the request headers
    const token = req.headers.authorization?.split(" ")[1]; // Extract "Bearer <token>"
    if (!token) {
      return res.status(401).json({ error: "Authorization token is missing" });
    }

    // Step 2: Verify and decode the token
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET); // Decode the token using the secret
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    // Step 3: Use the decoded token to fetch the member's data
    const member = await Member.findOne(
      { member_id: decoded.member_id }, // Match the member ID from the token
      "mobile whatsApp email address" // Specify only the fields to be retrieved
    );
    // Step 4: Check if the member exists
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Step 5: Respond with the member's profile information
    return res.status(200).json({
      mobile: member.mobile,
      whatsApp: member.whatsApp,
      email: member.email,
      address: member.address,
    });
  } catch (error) {
    // Step 6: Handle server errors
    console.error("Error fetching member profile:", error);
    return res.status(500).json({
      error: "An error occurred while fetching the profile information",
    });
  }
};

// Update member profile
exports.updateProfileInfo = async (req, res) => {
  try {
    const { password, email, mobile, whatsApp, address } = req.body;

    // Retrieve member ID from the decoded JWT token (set in the authMiddleware)
    const memberId = req.member.member_id; // Access member ID from req.member

    if (!memberId) {
      return res.status(400).json({ message: "Member ID not found in token" });
    }

    // Prepare the updated data
    const updateData = {};

    // If password is provided, hash it before updating
    if (password) {
      const salt = await bcrypt.genSalt(10); // Create a salt
      updateData.password = await bcrypt.hash(password, salt); // Hash the password
    }
    if (email) updateData.email = email;
    if (mobile) updateData.mobile = mobile;
    if (whatsApp) updateData.whatsApp = whatsApp;
    if (address) updateData.address = address;

    // Find and update the member in one operation
    const updatedMember = await Member.findOneAndUpdate(
      { member_id: memberId }, // Query condition
      { $set: updateData }, // Data to update
      { new: true } // Return the updated document
    );

    if (!updatedMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Respond with success
    res.status(200).json({ message: "Profile updated successfully!" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res
      .status(500)
      .json({ message: "Failed to update profile. Please try again later." });
  }
};

//get member has loan
exports.getMemberHasLoanById = async (req, res) => {
  try {
    // Step 1: Extract the token from the request headers
    const token = req.headers.authorization?.split(" ")[1]; // Extract "Bearer <token>"
    if (!token) {
      return res.status(401).json({ error: "Authorization token is missing" });
    }

    // Step 2: Verify and decode the token
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET); // Decode the token using the secret
    } catch (error) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const member = await Member.findOne({ member_id: decoded.member_id });

    // Check if member exists (admin users might not be in Member collection)
    if (!member) {
      return res.status(200).json({ loan: false }); // Admin users don't have loans
    }

    const loan = await Loan.findOne({
      memberId: member._id,
      loanRemainingAmount: { $gt: 0 },
    });

    if (loan) {
      return res.status(200).json({ loan: true });
    } else {
      return res.status(200).json({ loan: false });
    }
  } catch (error) {
    console.error("Error fetching member profile:", error);
    return res.status(500).json({
      error: "An error occurred while fetching the profile information",
    });
  }
};

//get member loan
// exports.getMemberLoanInfo=async (req, res) => {
//   const member_Id=req.query.member_id

//   // const loanInfo=await memberLoanInfo(member_Id)
// }
//get my loan
exports.getMyLoan = async (req, res) => {
  //calculating interest for loan according to payment date

  try {
    // Step 1: Extract the token from the request headers
    const member = await loggedMemberId(req);

    // Check if there's an error in getting the member or if member doesn't exist
    if (member && member.error) {
      return res.status(401).json({ error: member.error });
    }

    // If member is null (admin user), return no loan data
    if (!member) {
      return res.status(200).json({
        loan: null,
        message: "Admin users do not have loan information"
      });
    }

    const loan = await Loan.findOne({
      memberId: member._id,
      loanRemainingAmount: { $gt: 0 },
    })
      .populate({
        path: "memberId",
        select: "member_id name mobile",
      })
      .populate({
        path: "guarantor1Id",
        select: "member_id name mobile",
      })
      .populate({
        path: "guarantor2Id",
        select: "member_id name mobile",
      });
    let principlePayments = [];
    let interestPayments = [];
    let penaltyIntPayments = [];
    let lastIntPaymentDate = "";
    if (loan) {
      principlePayments = await LoanPrinciplePayment.find({
        loanId: loan?._id,
      }).select("date amount");
      interestPayments = await LoanInterestPayment.find({
        loanId: loan?._id,
      }).select("date amount");
      penaltyIntPayments = await PenaltyIntPayment.find({
        loanId: loan?._id,
      }).select("date amount");
      lastIntPaymentDate = await LoanInterestPayment.findOne({
        loanId: loan?._id,
      })
        .sort({ date: -1 })
        .select("date");

      // ------------------------------------------------------------------------------
      // const calculatedInterest = calculateInterest(
      //   loan[0]?.date,
      //   loan[0]?.loanRemainingAmount,
      //   lastInterestPaymentDate=lastIntPaymentDate,
      //   date
      // )
      // ------------------------------------------------------------------------------
      // Helper function to group payments by date
      const groupByDate = (payments) => {
        return payments.reduce((acc, payment) => {
          if (payment.date) {
            const date = new Date(payment.date).toISOString().split("T")[0]; // Format date as YYYY-MM-DD
            if (!acc[date]) {
              acc[date] = [];
            }
            acc[date].push(payment);
          }
          return acc;
        }, {});
      };

      // Group payments by date
      const groupedPrinciplePayments = groupByDate(principlePayments);
      const groupedInterestPayments = groupByDate(interestPayments);
      const groupedPenaltyIntPayments = groupByDate(penaltyIntPayments);

      // Combine grouped payments into an array of objects
      const allDates = new Set([
        ...Object.keys(groupedPrinciplePayments),
        ...Object.keys(groupedInterestPayments),
        ...Object.keys(groupedPenaltyIntPayments),
      ]);
      const groupedPayments = Array.from(allDates).map((date) => ({
        date,
        principleAmount:
          groupedPrinciplePayments[date]?.reduce(
            (sum, payment) => sum + payment.amount,
            0
          ) || 0,
        interestAmount:
          groupedInterestPayments[date]?.reduce(
            (sum, payment) => sum + payment.amount,
            0
          ) || 0,
        penaltyInterestAmount:
          groupedPenaltyIntPayments[date]?.reduce(
            (sum, payment) => sum + payment.amount,
            0
          ) || 0,
      }));

      const calculatedInterest = await interestCalculation(
        loan?.loanDate,
        loan?.loanRemainingAmount,
        lastIntPaymentDate?.date,
        new Date()
      );
      // Send the grouped payments in the response
      res.status(200).json({
        success: true,
        loan,
        groupedPayments,
        calculatedInterest,
      });
    } else {
      return res.status(200).json({ loan: false });
    }
  } catch (error) {
    console.error("Error fetching loan info:", error);
    return res.status(500).json({
      error: "An error occurred while fetching the member loan info",
    });
  }
};

// Get data for member home page
exports.getMember = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract "Bearer <token>"
    if (!token) {
      return res.status(401).json({ error: "Authorization token is missing" });
    }

    // Step 2: Verify and decode the token
    let decoded;
    decoded = jwt.verify(token, JWT_SECRET);
    const memberId = decoded.member_id;
    if (!memberId) {
      return res
        .status(400)
        .json({ error: "Member ID is required in headers." });
    }

    // Find member by ID
    const member = await Member.findOne({ member_id: memberId }).populate(
      "dependents"
      // "name",
      // 'relationship'
    );
    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    // Calculate fineTotal by summing up amounts in the fines array
    const fineTotal = member.fines?.reduce(
      (total, fine) => total + fine.amount,
      0
    );
    //getting all membership payments done by member
    // const allMembershipPayments = await MembershipPayment.find({
    //   memberId: member._id,
    // });
    //calculating membership payment due for this year
    //getting membership payments for this year
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);

    const membershipPayments = await MembershipPayment.find({
      memberId: member._id,
      date: {
        $gte: startOfYear,
        $lt: endOfYear,
      },
    }).select("date amount");

    const finePayments = await FinePayment.find({
      memberId: member._id,
      date: {
        $gte: startOfYear,
        $lt: endOfYear,
      },
    }).select("date amount");
    //getting total membership payments for this year
    const totalMembershipPayments = membershipPayments.reduce(
      (total, payment) => total + payment.amount,
      0 // Initial value for the total
    );
    //getting total fine payments for this year
    const totalFinePayments = finePayments.reduce(
      (total, payment) => total + payment.amount,
      0 // Initial value for the total
    );
    //calculating membership due for this year
    const currentMonth = new Date().getMonth();
    const monthlyBaseRate = await getMonthlyRateForYear(currentYear);
    if (member.siblingsCount > 0) {
      membershipCharge =
        (monthlyBaseRate * member.siblingsCount * 0.3 + monthlyBaseRate) * currentMonth;
    } else {
      membershipCharge = monthlyBaseRate * currentMonth;
    }
    const membershipDue = membershipCharge - totalMembershipPayments;
    // Respond with member details

    // Getting guarantor details (guarantor1 or guarantor2) with remaining loan amount
    const asGuarantor = await Loan.find({
      $or: [{ guarantor1Id: member._id }, { guarantor2Id: member._id }],
      loanRemainingAmount: { $ne: 0 },
    }).select("_id");


    const loanDetailsAsGuarantor = await Promise.all(
      asGuarantor.map(async (loan) => {
        // Get the last interest payment
        const lastIntPayment = await LoanInterestPayment.findOne({
          loanId: loan._id,
        })
          .sort({ date: -1 }) // Sort by date descending
          .select("date");

        // Get the loan document to access remaining amount, date, etc.
        const fullLoan = await Loan.findById(loan._id).select(
          "memberId loanDate loanRemainingAmount"
        );

        // Get the member details
        const loanMember = await Member.findById(fullLoan.memberId).select(
          "member_id name"
        );

        return {
          loanMember: loanMember,
          loanRemainingAmount: fullLoan.loanRemainingAmount,
          loanDate: fullLoan.loanDate,
          // loanId: loan._id,
          lastIntPaymentDate: lastIntPayment?.date || null,
        };
      })
    );


    res.status(200).json({
      area: member.area,
      address: member.address,
      mobile: member.mobile,
      whatsApp: member.whatsApp,
      email: member.email,
      due2023: member.due2023,
      meetingAbsents: member.meetingAbsents,
      dependents: member.dependents.map((dependent) => dependent),
      fineTotal, // Use the calculated fineTotal
      membershipDue: membershipDue,
      fineDue: fineTotal - totalFinePayments,
      loanDetailsAsGuarantor,
    });
  } catch (error) {
    console.error("Error fetching member data:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

//get basic data of the member
exports.getMemberById = async (req, res) => {
  const { memberId } = req.params;
  try {
    // Extract member_id from headers
    // const memberId = req.member.member_id;
    if (!memberId) {
      return res
        .status(400)
        .json({ error: "Member ID is required in headers." });
    }

    // Find member by ID
    const member = await Member.findOne({ member_id: memberId }).select(
      "_id name mobile whatsApp area member_id"
    );

    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    // Respond with member details
    res.status(200).json({
      member,
    });
  } catch (error) {
    console.error("Error fetching member data:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

//get payments data for member payments page
exports.getPayments = async (req, res) => {
  try {
    // Getting the authorization token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authorization token is missing" });
    }

    // Decode the token to extract member information
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const memberId = decoded.member_id;
    //get member id object

    const member_Id = await Member.findOne({ member_id: memberId }).select(
      "_id"
    );
    // Fetch membership payments
    const membershipPayments = await MembershipPayment.find({
      memberId: member_Id, //id object
    }).select("date amount _id");
    // Combine and group payments by date
    const paymentMap = {};

    membershipPayments.forEach((payment) => {
      const date = new Date(payment.date).toISOString().split("T")[0]; // Normalize date
      if (!paymentMap[date]) {
        paymentMap[date] = {
          date,
          mem_id: null,
          memAmount: 0,
          fine_id: null,
          fineAmount: 0,
        };
      }
      paymentMap[date].mem_id = payment._id;
      paymentMap[date].memAmount += payment.amount || 0;
    });

    // Fetch fine payments
    const finePayments = await FinePayment.find({
      memberId: member_Id, //id object
    }).select("date amount _id");
    finePayments.forEach((payment) => {
      const date = new Date(payment.date).toISOString().split("T")[0]; // Normalize date
      if (!paymentMap[date]) {
        paymentMap[date] = {
          date,
          mem_id: null,
          memAmount: 0,
          fine_id: null,
          fineAmount: 0,
        };
      }
      paymentMap[date].fine_id = payment._id;
      paymentMap[date].fineAmount += payment.amount || 0;
    });

    // Convert the map to an array and sort by date
    const allPayments = Object.values(paymentMap).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    //Process and group payments
    const formattedPayments = allPayments.map((payment) => ({
      ...payment,
      date:
        payment.date !== "Total"
          ? new Date(payment.date)
            .toISOString()
            .split("T")[0]
            .replace(/-/g, "/")
          : "Total",
    }));
    const grouped = formattedPayments.reduce((acc, payment) => {
      if (payment.date === "Total") return acc; // Skip the global total row
      const year = payment.date.split("/")[0]; // Extract the year
      if (!acc[year]) {
        acc[year] = {
          payments: [],
          totals: { memAmount: 0, fineAmount: 0 },
        };
      }

      acc[year].payments.push(payment);

      acc[year].totals.memAmount += payment.memAmount || 0;
      acc[year].totals.fineAmount += payment.fineAmount || 0;

      return acc;
    }, {});

    // Add totals to each year's group
    Object.keys(grouped).forEach((year) => {
      grouped[year].payments.push({
        date: "Total",
        memAmount: grouped[year].totals.memAmount,
        fineAmount: grouped[year].totals.fineAmount,
      });
    });
    // const fineTotalAmount = allPayments.reduce(
    //   (sum, payment) => sum + payment.fineAmount,
    //   0
    // );

    // Send the response with the previous due
    res.status(200).json({
      message: "Payments fetched successfully",

      payments: grouped,
    });
  } catch (error) {
    console.error("Error in getPayments:", error.message);
    res.status(500).json({
      error: "An error occurred while fetching payment data",
      message: error.message,
    });
  }
};

//get fines data for member fines page
exports.getFines = async (req, res) => {
  try {
    // Getting the authorization token
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authorization token is missing" });
    }

    // Decode the token to extract member information
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const memberId = decoded.member_id;

    // Get member ID object
    const member_Id = await Member.findOne({ member_id: memberId }).select(
      "_id"
    );
    if (!member_Id) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Fetch member fines
    const memberData = await Member.findById(member_Id).select("fines");
    const memberFines = memberData?.fines || [];

    // Process fines asynchronously
    const finePromises = memberFines.map((fine) => {
      const fineType = fine.eventType;
      const fineAmount = fine.amount;

      if (fineType === "funeral") {
        return Funeral.findById(fine.eventId)
          .select("date member_id")
          .populate("member_id", "name area")
          .then((funeral) => {
            if (!funeral) {
              console.error(`Funeral not found for eventId: ${fine.eventId}`);
              return null;
            }

            const date = new Date(funeral.date).toISOString().split("T")[0];

            return {
              date,
              fineType: `${funeral.member_id?.area} ${funeral.member_id?.name} ගේ සාමාජිකත්වය යටතේ අවමංගල්‍ය `,
              fineAmount,
              name: funeral.member_id?.name || "Unknown",
              area: funeral.member_id?.area || "Unknown",
            };
          })
          .catch((err) => {
            console.error("Error fetching funeral:", err);
            return null;
          });
      } else {
        if (fineType === "extraDue") {
          return Funeral.findById(fine.eventId)
            .select("date member_id")
            .populate("member_id", "name area")
            .then((funeral) => {
              if (!funeral) {
                console.error(`Funeral not found for eventId: ${fine.eventId}`);
                return null;
              }

              const date = new Date(funeral.date).toISOString().split("T")[0];

              return {
                date,
                fineType: `${funeral.member_id?.area} ${funeral.member_id?.name} ගේ සාමාජිකත්වය යටතේ අවමංගල්‍යයට අතිරේක ආධාර `,
                fineAmount,
                name: funeral.member_id?.name || "Unknown",
                area: funeral.member_id?.area || "Unknown",
              };
            })
            .catch((err) => {
              console.error("Error fetching funeral:", err);
              return null;
            });
        } else {
          if (fineType === "funeral-ceremony") {
            return Funeral.findById(fine.eventId)
              .select("date member_id")
              .populate("member_id", "name area")
              .then((funeral) => {
                if (!funeral) {
                  console.error(
                    `Funeral not found for eventId: ${fine.eventId}`
                  );
                  return null;
                }

                const date = new Date(funeral.date).toISOString().split("T")[0];

                return {
                  date,
                  fineType: `${funeral.member_id?.area} ${funeral.member_id?.name} ගේ සාමාජිකත්වය යටතේ අවමංගල්‍යයට දේහය ගෙන යාම`,
                  fineAmount,
                  name: funeral.member_id?.name || "Unknown",
                  area: funeral.member_id?.area || "Unknown",
                };
              })
              .catch((err) => {
                console.error("Error fetching funeral:", err);
                return null;
              });
          } else {
            if (fineType === "meeting") {
              return Meeting.findById(fine.eventId)
                .select("date")
                .then((meeting) => {
                  const date = new Date(meeting.date)
                    .toISOString()
                    .split("T")[0];

                  return {
                    date,
                    fineType: ` දින මහා සභාව වන විට මහා සභා වාර තුනක් නොපැමිණීම. `,
                    fineAmount,
                    // name: funeral.member_id?.name || "Unknown",
                    // area: funeral.member_id?.area || "Unknown",
                  };
                })
                .catch((err) => {
                  console.error("Error fetching funeral:", err);
                  return null;
                });
            }
          }
        }
      }

      return null;
    });

    // ✅ Wait for all fine processing to complete
    const fines = (await Promise.all(finePromises)).filter(Boolean);


    // ✅ Send the response with the properly populated fines array
    res.status(200).json({
      message: "Fines fetched successfully",
      fines: fines,
    });
  } catch (error) {
    console.error("Error in getFines:", error.message);
    res.status(500).json({
      error: "An error occurred while fetching fine data",
      message: error.message,
    });
  }
};

//get data of the member for account receipt page
exports.getMemberDueById = async (req, res) => {
  const { member_id } = req.query;
  try {
    // Extract member_id from headers
    // const memberId = req.member.member_id;
    if (!member_id) {
      return res
        .status(400)
        .json({ error: "Member ID is required in headers." });
    }

    // Find member by ID
    const member = await Member.findOne({ member_id: member_id }).select(
      "_id member_id name due2023 fines siblingsCount"
    );
    if (!member) {
      return res.status(404).json({ error: "Member not found." });
    }

    // Calculate fineTotal by summing up amounts in the fines array
    const fineTotal = member.fines?.reduce(
      (total, fine) => total + fine.amount,
      0
    );
    //getting total of fins and previous dues
    const due = fineTotal + member.due2023;
    const finePayments = await FinePayment.find({
      memberId: member._id,
      date: { $gt: new Date("2024-12-31T23:59:59.999Z") },
    });
    const totalFinePayments = finePayments?.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );

    const totalDue = due - totalFinePayments;
    // //getting all membership payments done by member
    // const allMembershipPayments = await MembershipPayment.find({
    //   memberId: member._id,
    // });
    //calculating membership payment due for this year
    //getting membership payments for this year
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear + 1, 0, 1);

    const membershipPayments = await MembershipPayment.find({
      memberId: member._id,
      date: {
        $gte: startOfYear,
        $lt: endOfYear,
      },
    }).select("date amount");
    //getting total membership payments for this year
    const totalMembershipPayments = membershipPayments.reduce(
      (total, payment) => total + payment.amount,
      0 // Initial value for the total
    );

    //calculating membership due for this year
    const currentMonth = new Date().getMonth();
    const monthlyBaseRate = await getMonthlyRateForYear(currentYear);
    if (member.siblingsCount > 0) {
      membershipCharge =
        (monthlyBaseRate * member.siblingsCount * 0.3 + monthlyBaseRate) * currentMonth;
    } else {
      membershipCharge = monthlyBaseRate * currentMonth;
    }
    const membershipDue = membershipCharge - totalMembershipPayments;

    // Respond with member details
    res.status(200).json({
      member,
      totalDue,
      membershipDue,
    });
  } catch (error) {
    console.error("Error fetching member data:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

//get family
exports.getFamily = async (req, res) => {
  const { member_id } = req.params;
  try {
    const member = await Member.findOne({ member_id: member_id })
      .select("name _id dateOfDeath")
      .populate("dependents");

    if (!member) {
      throw new Error("Member not found");
    }

    // Add "relationship": "member" to the member object
    const memberWithRelationship = {
      ...member.toObject(), // Convert Mongoose document to plain JS object
      relationship: "සාමාජික",
    };

    // // Create a new array with the member object and dependents

    const FamilyRegister = [memberWithRelationship, ...member.dependents];


    // Return the response with member and dependents
    res.status(200).json({
      success: true,
      FamilyRegister,
    });
  } catch (error) {
    // Handle server errors
    res.status(500).json({
      success: false,
      message: "Error fetching member details.",
      error: error.message,
    });
  }
};

//update the member date of death
exports.updateDiedStatus = async (req, res) => {
  const { _id, dateOfDeath } = req.body;

  // Convert dateOfDeath to a Date object
  const parsedDateOfDeath = new Date(dateOfDeath);

  // Check if the conversion results in a valid Date object
  if (
    !(parsedDateOfDeath instanceof Date) ||
    isNaN(parsedDateOfDeath.getTime())
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid or missing 'dateOfDeath'. It must be a valid Date object.",
    });
  }

  try {
    // Use Mongoose's `findOneAndUpdate` to update the died status
    const updatedMember = await Member.findOneAndUpdate(
      { _id }, // Filter condition
      { $set: { dateOfDeath } }, // Update the `died` field
      { new: true, runValidators: true } // Return the updated document and run validators
    );

    // If no member is found, return a 404 error
    if (!updatedMember) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    // Respond with the updated member
    res.status(200).json({
      success: true,
      message: "Died status updated successfully.",
      member: updatedMember,
    });
  } catch (error) {
    // Handle any server or database errors
    res.status(500).json({
      success: false,
      message: "Error updating died status.",
      error: error.message,
    });
  }
};

//update the Dependent death
exports.updateDependentDiedStatus = async (req, res) => {
  const { _id, dateOfDeath } = req.body;
  // Input validation
  // if (typeof member_id !== "number") {
  //   return res.status(400).json({
  //     success: false,
  //     message: "Invalid or missing member_id. It must be a number.",
  //   });
  // }

  // Convert dateOfDeath to a Date object
  // const parsedDateOfDeath = new Date(dateOfDeath);

  // // Check if the conversion results in a valid Date object
  // if (
  //   !(parsedDateOfDeath instanceof Date) ||
  //   isNaN(parsedDateOfDeath.getTime())
  // ) {
  //   return res.status(400).json({
  //     success: false,
  //     message:
  //       "Invalid or missing 'dateOfDeath'. It must be a valid Date object.",
  //   });
  // }

  try {
    // Use Mongoose's `findOneAndUpdate` to update the died status
    const updatedDependent = await Dependant.findOneAndUpdate(
      { _id }, // Filter condition
      { $set: { dateOfDeath } }, // Update the `died` field
      { new: true, runValidators: true } // Return the updated document and run validators
    );

    // If no dependent is found, return a 404 error
    if (!updatedDependent) {
      return res.status(404).json({
        success: false,
        message: "Member not found.",
      });
    }

    // Respond with the updated dependent
    res.status(200).json({
      success: true,
      message: "Died status updated successfully.",
      dependent: updatedDependent,
    });
  } catch (error) {
    // Handle any server or database errors
    res.status(500).json({
      success: false,
      message: "Error updating died status.",
      error: error.message,
    });
  }
};

// Retrieve all members who are active !(deactivated)
exports.getActiveMembers = async (req, res) => {
  try {
    const members = await Member.find({
      $or: [
        { deactivated_at: { $exists: false } }, // No deactivatedDate field
        { deactivated_at: null }, // deactivatedDate is explicitly null
      ],
    })
      .select("-password")
      .sort("member_id"); // Excludes the password field
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching members.",
      error: error.message,
    });
  }
};

//get admins for funeral
exports.getAdminsForFuneral = async (req, res) => {
  try {
    const { area } = req.query;
    // Generalize the area for matching
    const baseArea = area.replace(/\s*\d+$/, "").trim();

    const result = await Admin.findOne(
      { "areaAdmins.area": { $regex: `^${baseArea}`, $options: "i" } }, // Match the area admin
      {
        chairman: 1,
        secretary: 1,
        viceChairman: 1,
        viceSecretary: 1,
        treasurer: 1,
        loanTreasurer: 1,
        "areaAdmins.$": 1, // Return only the matching areaAdmin
      }
    ).lean();

    if (result) {
      // Collect all member IDs from main admins
      const memberIds = [
        result.chairman?.memberId,
        result.secretary?.memberId,
        result.viceChairman?.memberId,
        result.viceSecretary?.memberId,
        result.treasurer?.memberId,
        result.loanTreasurer?.memberId,
      ];

      // If an areaAdmin is found, add its memberId and helpers' memberIds
      if (result.areaAdmins && result.areaAdmins.length > 0) {
        const { memberId, helper1, helper2 } = result.areaAdmins[0];
        memberIds.push(memberId, helper1?.memberId, helper2?.memberId);
      }

      // Filter out null/undefined values
      const uniqueMemberIds = [...new Set(memberIds.filter(Boolean))].sort(
        (a, b) => a - b
      );

      res.status(200).json(uniqueMemberIds);
    } else {
      res.status(404).json({ message: "No matching data found." });
    }
  } catch (error) {
    console.error("Error getting Admin IDs:", error.message);
    res
      .status(500)
      .json({ message: "Error getting Admin IDs", error: error.message });
  }
};

//get membership death details
exports.getMembershipDeathById = async (req, res) => {
  try {
    const { member_id } = req.query;
    // Find the member by member_id and populate dependents
    const member = await Member.findOne({ member_id })
      .populate("dependents", "name relationship dateOfDeath") // Populate dependents with necessary fields
      .select("_id member_id name dateOfDeath dependents area");

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // Check for deceased dependents
    const deceasedDependents = member.dependents.filter(
      (dependent) => dependent.dateOfDeath
    );

    // If member or any dependent has `dateOfDeath`, return the information
    if (member.dateOfDeath || deceasedDependents.length > 0) {
      return res.status(200).json({
        message: "Deceased member or dependents retrieved",
        data: {
          member: {
            _id: member._id,
            member_id: member.member_id,
            name: member.name,
            area: member.area,
            mob_tel: member.mob_tel,
            res_tel: member.res_tel,
            dateOfDeath: member.dateOfDeath,
          },
          dependents: deceasedDependents, // Array of deceased dependents
        },
      });
    }

    // If no `dateOfDeath` for member or dependents, return an empty array
    return res.status(200).json({
      message: "No deceased member or dependents found",
      data: [],
    });
  } catch (error) {
    console.error("Error retrieving member and dependents:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
//get membership all details for member info view
exports.getMemberAllInfoById = async (req, res) => {
  try {
    const { member_id, exclude_loan_installment } = req.query;
    const member = await getMembershipDetails(member_id);
    if (!member) {
      return res.status(404).json({ message: "Member not found", memberData: null });
    }
    const member_Id = member._id;
    // Get monthly membership rate for current year
    const currentYear = new Date().getFullYear();
    const monthlyRate = await getMonthlyRateForYear(currentYear);
    const membershipRate = await membershipRateForMember(
      member.siblingsCount,
      monthlyRate
    );

    const totalMembershipPayment = await getTotalMembershipPayment(
      String(currentYear),
      member_Id
    );
    const currentMembershipDue =
      new Date().getMonth() * membershipRate - totalMembershipPayment;
    // const membershipDue=membershipRateForMember
    const groupedPayments = await getAllPaymentsByMember(member_Id);
    // Augment groupedPayments with year-aware membership rate and expected membership payment
    try {
      const paymentYears = Object.keys(groupedPayments || {});
      const nowYear = new Date().getFullYear();
      for (const y of paymentYears) {
        const yi = parseInt(y, 10);
        const monthlyBase = await getMonthlyRateForYear(yi);
        const monthsElapsed = yi === nowYear ? new Date().getMonth() : 12;
        const expected = monthlyBase * monthsElapsed;
        if (!groupedPayments[y]) groupedPayments[y] = { payments: [], totals: { memAmount: 0, fineAmount: 0 } };
        groupedPayments[y].monthlyBaseRate = monthlyBase;
        groupedPayments[y].expectedMembershipPayment = expected;
      }
    } catch (err) {
      console.error('Error augmenting groupedPayments with membership rates:', err);
    }
    const finesTotalPayments = groupedPayments["2025"]?.totals.fineAmount || 0;
    const fines = await getAllFinesOfMember(member_Id);
    const finesTotal = fines["2025"]?.total.fineAmount || 0;
    const loanInfo = await memberLoanInfo(member_Id);

    // Calculate totalDue - include loan installment based on unpaid months
    let totalDue;
    const hasUnpaidLoanMonths = loanInfo?.calculatedInterest?.int > 0 || loanInfo?.calculatedInterest?.penInt > 0;

    if (exclude_loan_installment === 'true') {
      // For guarantors: include loan installments only if there are unpaid months
      totalDue = hasUnpaidLoanMonths && loanInfo?.calculatedInterest?.installment
        ? member.due2023 +
        finesTotal -
        finesTotalPayments +
        currentMembershipDue +
        loanInfo.calculatedInterest.installment
        : member.due2023 +
        finesTotal -
        finesTotalPayments +
        currentMembershipDue;
    } else {
      // For loan borrowers: include loan installments only if there are unpaid months
      totalDue = hasUnpaidLoanMonths && loanInfo?.calculatedInterest?.installment
        ? member.due2023 +
        finesTotal -
        finesTotalPayments +
        currentMembershipDue +
        loanInfo.calculatedInterest.installment
        : member.due2023 +
        finesTotal -
        finesTotalPayments +
        currentMembershipDue;
    }

    // Determine if there's a year-specific rate for next year (so UI can show upcoming changes).
    // We read the raw setting document here so the UI can display the upcoming value
    // even if its `effectiveFrom` is in the future.
    let upcomingMembershipRate = null;
    try {
      const nextYear = currentYear + 1;
      const nextKey = `MONTHLY_MEMBERSHIP_RATE_${nextYear}`;
      const nextDoc = await SystemSettings.findOne({ settingName: nextKey });
      if (nextDoc) {
        upcomingMembershipRate = Number(nextDoc.settingValue) || null;
      }
    } catch (err) {
      console.error('Error fetching upcoming membership rate:', err);
    }

    return res.status(200).json({
      message: "Member information retrieved successfully",
      memberData: {
        memberDetails: member,
        membershipRate,
        currentMembershipDue,
        fines,
        groupedPayments,
        loanInfo,
        totalDue,
        upcomingMembershipYear: currentYear + 1,
        upcomingMembershipRate,
      },
    });
  } catch (error) {
    console.error("Error retrieving member full details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get next member ID
exports.getNextId = async (req, res) => {
  try {
    // Find the member with the highest member_id
    const highestMember = await Member.findOne({})
      .sort({ member_id: -1 }) // Sort by member_id in descending order
      .select("member_id"); // Only select the member_id field

    // Determine the next member_id
    const nextMemberId = highestMember ? highestMember.member_id + 1 : 1;

    res.status(200).json({
      success: true,
      nextMemberId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting next memberId.",
      error: error.message,
    });
  }
};

//get all member ids for funeral attendance chart
exports.getMemberIdsForFuneralAttendance = async (req, res) => {
  try {
    const members = await Member.find({
      $or: [
        { deactivated_at: { $exists: false } }, // No deactivatedDate field
        { deactivated_at: null },
      ],
      status: { $nin: ["free", "attendance-free"] }, // Exclude free and attendance-free members
      roles: {
        $not: {
          $elemMatch: {
            $in: [
              "chairman",
              "secretary",
              "treasurer",
              "loan-treasurer",
              "vice-secretary",
              "vice-chairman",
              "auditor",
            ],
          },
        },
      }, // Exclude officers
    })
      .select("member_id status") // Select member_id and status fields
      .sort("member_id"); // Sort by member_id

    // Create both the simple array for backward compatibility and detailed array with status
    const memberIds = members.map((member) => member.member_id);
    const membersWithStatus = members.map((member) => ({
      member_id: member.member_id,
      status: member.status || 'active', // Default to 'active' if no status
      showStatus: member.status === 'attendance-free' || member.status === 'free' // Only show these statuses
    }));

    res.status(200).json({
      success: true,
      memberIds: memberIds, // Keep for backward compatibility
      membersWithStatus: membersWithStatus // New detailed format
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching members.",
      error: error.message,
    });
  }
};

// Get member details for funeral attendance document printing
exports.getMembersForFuneralDocument = async (req, res) => {
  try {
    const members = await Member.find({
      $or: [
        { deactivated_at: { $exists: false } }, // No deactivatedDate field
        { deactivated_at: null },
      ],
    })
      .select("member_id name area status") // Select required fields for document
      .sort("member_id"); // Sort by member_id

    const membersForDocument = members.map((member) => ({
      member_id: member.member_id,
      name: member.name,
      area: member.area,
      status: member.status || 'active' // Default to 'active' if no status
    }));

    res.status(200).json({
      success: true,
      members: membersForDocument
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching member details for document.",
      error: error.message,
    });
  }
};

// Helper function is no longer needed since we're not using status codes
//get all member ids for meeting attendance chart
exports.getMembersForMeetingAttendance = async (req, res) => {
  try {
    const members = await Member.find({
      $or: [
        { deactivated_at: { $exists: false } }, // No deactivatedDate field
        { deactivated_at: null },
      ],
      status: { $nin: ["attendance-free", "free"] },
    })
      .select("member_id") // Select only the member_id field
      .sort("member_id"); // Sort by member_id

    const memberIds = members.map((member) => member.member_id);
    res.status(200).json({ success: true, memberIds: memberIds });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching members.",
      error: error.message,
    });
  }
};

// Get all member dues for meeting sign sheet
exports.getDueForMeetingSign = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); // Months are 0-based in JS

    // Get the last two meetings
    const lastTwoMeetings = await Meeting.find()
      .sort({ date: -1 })
      .limit(2)
      .select("absents date");

    console.log("Last two meetings found:", lastTwoMeetings.length);
    console.log("Meeting dates:", lastTwoMeetings.map(m => ({ date: m.date, absentsCount: m.absents?.length || 0 })));

    // Find members who were absent in both meetings
    // Note: Meeting.absents stores member_id (numeric), not MongoDB _id
    let consecutiveAbsentMemberIds = [];
    if (lastTwoMeetings.length === 2) {
      const firstMeetingAbsents = lastTwoMeetings[0].absents.map(id => id.toString());
      const secondMeetingAbsents = lastTwoMeetings[1].absents.map(id => id.toString());
      consecutiveAbsentMemberIds = firstMeetingAbsents.filter(id => 
        secondMeetingAbsents.includes(id)
      );
      console.log("First meeting absents:", firstMeetingAbsents.slice(0, 5), "... total:", firstMeetingAbsents.length);
      console.log("Second meeting absents:", secondMeetingAbsents.slice(0, 5), "... total:", secondMeetingAbsents.length);
      console.log("Consecutive absents found:", consecutiveAbsentMemberIds.length, "member IDs:", consecutiveAbsentMemberIds.slice(0, 10));
    } else {
      console.log("Not enough meetings to check consecutive absences");
    }

    // Get all active members
    const members = await Member.find({
      status: { $ne: "free" }, // Exclude members with status 'free'
      deactivated_at: null, // Exclude deactivated members
    })
      .select("_id member_id name due2023 fines")
      .sort("member_id");

    // Get membership payments for the current year
    const membershipPayments = await MembershipPayment.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(`${currentYear}-01-01`), // Start of current year
            $lt: new Date(`${currentYear + 1}-01-01`), // Start of next year
          },
        },
      },
      {
        $group: {
          _id: "$memberId",
          totalPaid: { $sum: "$amount" },
        },
      },
    ]);
    // Convert payments to a map for quick lookup
    const membershipPaymentMap = new Map();
    membershipPayments.forEach((payment) => {
      membershipPaymentMap.set(payment._id.toString(), payment.totalPaid);
    });

    // Get fine payments for the current year
    const finePayments = await FinePayment.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(`${currentYear}-01-01`), // Start of current year
            $lt: new Date(`${currentYear + 1}-01-01`), // Start of next year
          },
        },
      },
      {
        $group: {
          _id: "$memberId",
          totalPaid: { $sum: "$amount" },
        },
      },
    ]);
    // Convert payments to a map for quick lookup
    const finePaymentMap = new Map();
    finePayments.forEach((payment) => {
      finePaymentMap.set(payment._id.toString(), payment.totalPaid);
    });

    // Determine base monthly rate for the current year
    const monthlyBaseRate = await getMonthlyRateForYear(currentYear);

    // Calculate total membership dues for each member
    const memberDues = members.map((member) => {
      const memberShipTotalPaid =
        membershipPaymentMap.get(member._id.toString()) || 0;
      const membershipDue = currentMonth * monthlyBaseRate - memberShipTotalPaid;
      const totalFines = member.fines?.reduce(
        (sum, fine) => sum + fine.amount,
        0
      );
      const fineTotalPaid = finePaymentMap.get(member._id.toString()) || 0;

      const totalDue =
        membershipDue + member.due2023 + totalFines - fineTotalPaid;

      // Compare member_id (numeric) with consecutiveAbsentMemberIds (strings)
      const hasAbsents = consecutiveAbsentMemberIds.includes(member.member_id.toString());
      return {
        member_id: member.member_id,
        // name: member.name,
        // membershipDue: membershipDue < 0 ? 0 : membershipDue,
        // due2023: member.due2023,
        // totalFines: totalFines,
        totalDue: totalDue, // Total amount due
        hasConsecutiveAbsents: hasAbsents,
      };
    });

    const membersWithAbsents = memberDues.filter(m => m.hasConsecutiveAbsents);
    console.log(`Total members with consecutive absents in response: ${membersWithAbsents.length}`);
    if (membersWithAbsents.length > 0) {
      console.log("Sample members with absents:", membersWithAbsents.slice(0, 10).map(m => m.member_id));
    }

    res.status(200).json(memberDues);
  } catch (error) {
    console.error("Error fetching total dues:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//delete a fine by fine id
exports.deleteFineById = async (req, res) => {
  try {
    const { member_id, fine_id } = req.body;

    // Find and update the member by removing the fine with the given fine_id
    const updatedMember = await Member.findOneAndUpdate(
      { member_id: member_id },
      { $pull: { fines: { _id: fine_id } } }, // Remove fine with matching _id
      { new: false }
    ).select("member_id name fines");


    if (!updatedMember) {
      return res
        .status(404)
        .json({ message: "Member not found or fine not deleted" });
    }

    res.status(200).json({
      message: "Fine deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting fine:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//blacklisting members
exports.blacklistDueLoanMembers = async (req, res) => {
  const checkAndBlacklistMembers = async () => {
    const tenMonthsAgo = new Date();
    tenMonthsAgo.setMonth(tenMonthsAgo.getMonth() - 10);

    // const oneYearAgo = new Date()
    // oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    // Step 1: Blacklist members with active loans older than 10 months
    const overdueLoans = await Loan.find({
      loanDate: { $lte: tenMonthsAgo },
      loanRemainingAmount: { $gt: 0 },
    });

    for (const loan of overdueLoans) {
      await Member.findByIdAndUpdate(loan.memberId, {
        isBlacklisted: true,
        // blacklistedUntil: new Date(
        //   new Date(loan.loanDate).setFullYear(
        //     new Date(loan.loanDate).getFullYear() + 1
        //   )
        // ),
      });
    }
    return res.status(200).json({ message: "Members blacklisted" });
    // Step 2: Whitelist members whose blacklisted period is over
    // await Member.updateMany(
    //   {
    //     isBlacklisted: true,
    //     blacklistedUntil: { $lte: new Date() },
    //   },
    //   {
    //     isBlacklisted: false,
    //     blacklistedUntil: null,
    //   }
    // );
  };
};

// Create a new member
exports.createMember = async (req, res) => {
  try {
    const {
      member_id,
      name,
      area,
      phone,
      mobile,
      whatsApp,
      address,
      email,
      nic,
      birthday,
      siblingsCount,
      status,
      dependents
    } = req.body;

    // Validate required fields
    if (!member_id || !name) {
      return res.status(400).json({
        error: "Member ID and Name are required fields"
      });
    }

    // Check if member ID already exists
    const existingMember = await Member.findOne({ member_id });
    if (existingMember) {
      return res.status(400).json({
        error: "Member ID already exists"
      });
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await Member.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({
          error: "Email already exists"
        });
      }
    }

    // Check if NIC already exists (if provided)
    if (nic) {
      const existingNIC = await Member.findOne({ nic });
      if (existingNIC) {
        return res.status(400).json({
          error: "NIC already exists"
        });
      }
    }

    // Create dependents first if they exist
    let dependentIds = [];
    if (dependents && Array.isArray(dependents) && dependents.length > 0) {
      const validDependents = dependents.filter(dep => dep.name && dep.relationship && dep.birthday);

      for (const depData of validDependents) {
        const dependent = new Dependant({
          name: depData.name.trim(),
          relationship: depData.relationship,
          birthday: new Date(depData.birthday),
          nic: depData.nic || null,
          dateOfDeath: depData.dateOfDeath ? new Date(depData.dateOfDeath) : null,
        });

        const savedDependent = await dependent.save();
        dependentIds.push(savedDependent._id);
      }
    }

    // Create new member
    const birthYear = birthday ? new Date(birthday).getFullYear().toString() : member_id.toString();

    const newMember = new Member({
      member_id,
      name: name.trim(),
      area: area?.trim(),
      phone,
      mobile,
      whatsApp,
      address: address?.trim(),
      email: email?.toLowerCase(),
      nic,
      birthday: birthday ? new Date(birthday) : undefined,
      siblingsCount: siblingsCount || 0,
      status: status || "regular",
      roles: ["member"], // Default role
      due2023: 0, // Default previous due
      meetingAbsents: 0, // Default meeting absents
      fines: [], // Default empty fines array
      password: birthYear, // Set password to birth year if available, otherwise member_id
      dependents: dependentIds, // Add dependent IDs
    });

    const savedMember = await newMember.save();

    res.status(201).json({
      success: true,
      message: "Member created successfully",
      member: {
        member_id: savedMember.member_id,
        name: savedMember.name,
        area: savedMember.area,
        status: savedMember.status,
        joined_date: savedMember.joined_date,
        dependentsCount: dependentIds.length,
      },
    });

  } catch (error) {
    console.error("Error creating member:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        error: `${duplicateField} already exists`
      });
    }

    res.status(500).json({
      error: "An error occurred while creating the member",
      details: error.message,
    });
  }
};

// Get member by ID with dependents for update form
exports.getMemberForUpdate = async (req, res) => {
  try {
    const { member_id } = req.params;

    if (!member_id) {
      return res.status(400).json({
        error: "Member ID is required"
      });
    }

    // Find member and populate dependents
    const member = await Member.findOne({ member_id })
      .populate('dependents')
      .select('-password'); // Exclude password field

    if (!member) {
      return res.status(404).json({
        error: "Member not found"
      });
    }

    res.status(200).json({
      success: true,
      member: member
    });

  } catch (error) {
    console.error("Error fetching member for update:", error);
    res.status(500).json({
      error: "An error occurred while fetching member details",
      details: error.message,
    });
  }
};

// Update member with dependents
exports.updateMember = async (req, res) => {
  try {
    const { member_id } = req.params;
    const {
      name,
      area,
      phone,
      mobile,
      whatsApp,
      address,
      email,
      nic,
      birthday,
      siblingsCount,
      status,
      dependents
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: "Name is required"
      });
    }

    // Find the existing member
    const existingMember = await Member.findOne({ member_id });
    if (!existingMember) {
      return res.status(404).json({
        error: "Member not found"
      });
    }

    // Check if email already exists for another member
    if (email && email !== existingMember.email) {
      const emailExists = await Member.findOne({
        email: email.toLowerCase(),
        member_id: { $ne: member_id }
      });
      if (emailExists) {
        return res.status(400).json({
          error: "Email already exists for another member"
        });
      }
    }

    // Check if NIC already exists for another member
    if (nic && nic !== existingMember.nic) {
      const nicExists = await Member.findOne({
        nic: nic,
        member_id: { $ne: member_id }
      });
      if (nicExists) {
        return res.status(400).json({
          error: "NIC already exists for another member"
        });
      }
    }

    // Handle dependents update
    let dependentIds = [];

    if (dependents && Array.isArray(dependents) && dependents.length > 0) {
      const validDependents = dependents.filter(dep => dep.name && dep.relationship && dep.birthday);

      // Remove existing dependents that are not in the update
      if (existingMember.dependents && existingMember.dependents.length > 0) {
        for (const existingDepId of existingMember.dependents) {
          const stillExists = validDependents.find(dep => dep._id && dep._id.toString() === existingDepId.toString());
          if (!stillExists) {
            await Dependant.findByIdAndDelete(existingDepId);
          }
        }
      }

      // Create or update dependents
      for (const depData of validDependents) {
        if (depData._id) {
          // Update existing dependent
          const updatedDependent = await Dependant.findByIdAndUpdate(
            depData._id,
            {
              name: depData.name.trim(),
              relationship: depData.relationship,
              birthday: new Date(depData.birthday),
              nic: depData.nic || null,
              dateOfDeath: depData.dateOfDeath ? new Date(depData.dateOfDeath) : null,
            },
            { new: true }
          );
          if (updatedDependent) {
            dependentIds.push(updatedDependent._id);
          }
        } else {
          // Create new dependent
          const dependent = new Dependant({
            name: depData.name.trim(),
            relationship: depData.relationship,
            birthday: new Date(depData.birthday),
            nic: depData.nic || null,
            dateOfDeath: depData.dateOfDeath ? new Date(depData.dateOfDeath) : null,
          });

          const savedDependent = await dependent.save();
          dependentIds.push(savedDependent._id);
        }
      }
    } else {
      // No dependents provided, remove existing ones
      if (existingMember.dependents && existingMember.dependents.length > 0) {
        for (const existingDepId of existingMember.dependents) {
          await Dependant.findByIdAndDelete(existingDepId);
        }
      }
    }

    // Update member
    const updatedMember = await Member.findOneAndUpdate(
      { member_id },
      {
        name: name.trim(),
        area: area?.trim(),
        phone,
        mobile,
        whatsApp,
        address: address?.trim(),
        email: email?.toLowerCase(),
        nic,
        birthday: birthday ? new Date(birthday) : undefined,
        siblingsCount: siblingsCount || 0,
        status: status || "regular",
        dependents: dependentIds,
      },
      { new: true, runValidators: true }
    ).populate('dependents');

    res.status(200).json({
      success: true,
      message: "Member updated successfully",
      member: {
        member_id: updatedMember.member_id,
        name: updatedMember.name,
        area: updatedMember.area,
        status: updatedMember.status,
        dependentsCount: dependentIds.length,
      },
    });

  } catch (error) {
    console.error("Error updating member:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        error: `${duplicateField} already exists`
      });
    }

    res.status(500).json({
      error: "An error occurred while updating the member",
      details: error.message,
    });
  }
};

// Delete member and all related data
exports.deleteMember = async (req, res) => {
  try {
    const { member_id } = req.params;

    // Find the member to delete
    const member = await Member.findOne({ member_id });
    if (!member) {
      return res.status(404).json({
        error: "Member not found"
      });
    }

    // Delete all dependents
    if (member.dependents && member.dependents.length > 0) {
      await Dependant.deleteMany({ _id: { $in: member.dependents } });
    }

    // Delete related data
    const memberId = member._id;

    // Delete membership payments
    await MembershipPayment.deleteMany({ memberId });

    // Delete fine payments
    await FinePayment.deleteMany({ memberId });

    // Delete loan payments if member has loans
    const loans = await Loan.find({ memberId });
    for (const loan of loans) {
      await LoanPrinciplePayment.deleteMany({ loanId: loan._id });
      await LoanInterestPayment.deleteMany({ loanId: loan._id });
      await PenaltyIntPayment.deleteMany({ loanId: loan._id });
    }

    // Delete loans
    await Loan.deleteMany({ memberId });

    // Delete member from funeral records (as attendee)
    await Funeral.updateMany(
      { attendees: memberId },
      { $pull: { attendees: memberId } }
    );

    // Delete member from meeting attendance
    await Meeting.updateMany(
      { attendees: memberId },
      { $pull: { attendees: memberId } }
    );

    // Finally delete the member
    await Member.findOneAndDelete({ member_id });

    res.status(200).json({
      success: true,
      message: "Member and all related data deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting member:", error);
    res.status(500).json({
      error: "An error occurred while deleting the member",
      details: error.message,
    });
  }
};

// Search members by area
exports.searchMembersByArea = async (req, res) => {
  try {
    const { area } = req.query;

    if (!area) {
      return res.status(400).json({
        error: "Area parameter is required"
      });
    }

    // Search for members in the specified area
    const members = await Member.find({
      area: area,
      $or: [
        { deactivated_at: { $exists: false } }, // No deactivated_at field
        { deactivated_at: null }, // deactivated_at is null
      ],
    })
      .select("member_id name area mobile whatsApp address status joined_date")
      .sort({ member_id: 1 }); // Sort by member_id

    res.status(200).json({
      success: true,
      area: area,
      count: members.length,
      members: members,
    });

  } catch (error) {
    console.error("Error searching members by area:", error);
    res.status(500).json({
      error: "An error occurred while searching members",
      details: error.message,
    });
  }
};

// Search members by name
exports.searchMembersByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        error: "Name parameter is required"
      });
    }

    // Use aggregation to search both member names and dependent names
    const members = await Member.aggregate([
      // Match active members only
      {
        $match: {
          $or: [
            { deactivated_at: { $exists: false } },
            { deactivated_at: null },
          ]
        }
      },
      // Lookup dependents
      {
        $lookup: {
          from: "dependents", // Collection name in MongoDB
          localField: "dependents",
          foreignField: "_id",
          as: "dependents"
        }
      },
      // Match members whose name OR any dependent's name matches
      {
        $match: {
          $or: [
            { name: { $regex: name, $options: 'i' } }, // Member name matches
            { "dependents.name": { $regex: name, $options: 'i' } } // Any dependent name matches
          ]
        }
      },
      // Project the fields we need
      {
        $project: {
          member_id: 1,
          name: 1,
          area: 1,
          mobile: 1,
          whatsApp: 1,
          address: 1,
          status: 1,
          joined_date: 1,
          dependents: {
            name: 1,
            relationship: 1,
            dateOfDeath: 1
          }
        }
      },
      // Sort by member_id
      {
        $sort: { member_id: 1 }
      }
    ]);

    // Add match information
    const membersWithMatchInfo = members.map(member => {
      // Check if member name matches
      const memberNameMatches = member.name.toLowerCase().includes(name.toLowerCase());

      // Check which dependents match
      const matchingDependents = member.dependents.filter(dep =>
        dep.name.toLowerCase().includes(name.toLowerCase())
      );

      // Add match information
      member.matchInfo = {
        memberNameMatches,
        matchingDependents: matchingDependents.map(dep => ({
          name: dep.name,
          relationship: dep.relationship
        }))
      };

      return member;
    });

    res.status(200).json({
      success: true,
      searchTerm: name,
      count: membersWithMatchInfo.length,
      members: membersWithMatchInfo,
    });

  } catch (error) {
    console.error("Error searching members by name:", error);
    res.status(500).json({
      error: "An error occurred while searching members",
      details: error.message,
    });
  }
};

// Get all unique areas from members
exports.getAreas = async (req, res) => {
  try {
    const areas = await Member.distinct('area');
    const filteredAreas = areas.filter(area => area && area.trim() !== '');

    res.status(200).json({
      success: true,
      areas: filteredAreas.sort(),
    });
  } catch (error) {
    console.error("Error fetching areas:", error);
    res.status(500).json({
      error: "An error occurred while fetching areas",
      details: error.message,
    });
  }
};

// Get members for collection list - excludes certain roles, free members, and area admin
exports.getMembersForCollection = async (req, res) => {
  try {
    const { area } = req.query;

    if (!area) {
      return res.status(400).json({
        success: false,
        error: "Area parameter is required"
      });
    }

    // Excluded roles - members with any of these roles are considered privileged
    const privilegedRoles = [
      "chairman",
      "secretary",
      "treasurer",
      "loan-treasurer",
      "vice-secretary",
      "vice-chairman"
    ];

    // Check whether caller wants admins included in the result
    const includeAdmins = req.query.includeAdmins === 'true' || req.query.includeAdmins === '1'
    // Check whether caller wants free members included
    const includeFree = req.query.includeFree === 'true' || req.query.includeFree === '1'

    // Get admin document so we can identify area admins/helpers and main officers
    const adminDoc = await Admin.findOne({});
    const areaAdminIds = [];
    const officerIds = new Set();

    if (adminDoc) {
      if (adminDoc.areaAdmins) {
        const areaAdmin = adminDoc.areaAdmins.find(a => a.area === area)
        if (areaAdmin) {
          // main admin id
          if (areaAdmin.memberId) areaAdminIds.push(areaAdmin.memberId)
          // helpers (keep for exclusion logic but mark separately)
          if (areaAdmin.helper1 && areaAdmin.helper1.memberId) areaAdminIds.push(areaAdmin.helper1.memberId)
          if (areaAdmin.helper2 && areaAdmin.helper2.memberId) areaAdminIds.push(areaAdmin.helper2.memberId)
        }
      }

      // Collect main officer IDs
      const officers = [
        'chairman', 'secretary', 'viceChairman', 'viceSecretary', 'treasurer', 'loanTreasurer'
      ]
      officers.forEach(r => {
        if (adminDoc[r] && adminDoc[r].memberId) officerIds.add(adminDoc[r].memberId)
      })
    }

    // Build base query
    const baseQuery = { area: area }
    // Exclude free members by default, unless includeFree is requested
    if (!includeFree) baseQuery.status = { $ne: 'free' }

    // If caller did NOT request admins, keep existing exclusions
    if (!includeAdmins) {
      baseQuery.roles = { $not: { $elemMatch: { $in: privilegedRoles } } }
      baseQuery.member_id = { $nin: areaAdminIds }
    }

    // Exclude deactivated and deceased members from collection lists.
    // Be defensive: some rows may have malformed values (e.g. string "null") stored in
    // deactivated_at. We treat members as active only when deactivated_at is missing or null
    // (or stored as a non-date string), and when dateOfDeath is missing/null.
    const activeDeactivatedCondition = {
      $or: [
        { deactivated_at: { $exists: false } },
        { deactivated_at: null },
        { deactivated_at: { $type: 'string' } }
      ]
    }

    const noDeathCondition = {
      $or: [
        { dateOfDeath: { $exists: false } },
        { dateOfDeath: null }
      ]
    }

    // merge into baseQuery
    baseQuery.$and = [activeDeactivatedCondition, noDeathCondition]

    const members = await Member.find(baseQuery)
      .select('member_id name area status roles')
      .sort({ member_id: 1 })

    // Attach explicit flags so frontend can style area admins and officers differently
    // Identify main admin id and helper ids for this area (if present in adminDoc)
    let areaAdminMainId = null
    const areaHelperIds = []
    if (adminDoc && adminDoc.areaAdmins) {
      const areaAdmin = adminDoc.areaAdmins.find(a => a.area === area)
      if (areaAdmin) {
        if (areaAdmin.memberId) areaAdminMainId = areaAdmin.memberId
        if (areaAdmin.helper1 && areaAdmin.helper1.memberId) areaHelperIds.push(areaAdmin.helper1.memberId)
        if (areaAdmin.helper2 && areaAdmin.helper2.memberId) areaHelperIds.push(areaAdmin.helper2.memberId)
      }
    }

    const membersWithFlags = members.map(m => {
      const obj = m.toObject()
      const isAreaAdmin = areaAdminMainId && areaAdminMainId === obj.member_id
      const isAreaHelper = areaHelperIds.includes(obj.member_id)
      const isOfficer = officerIds.has(obj.member_id)
      const hasPrivilegedRole = Array.isArray(obj.roles) && obj.roles.some(r => privilegedRoles.includes(r))
      return { ...obj, isAreaAdmin, isAreaHelper, isOfficer, isPrivileged: isAreaAdmin || isOfficer || hasPrivilegedRole }
    })

    res.status(200).json({
      success: true,
      area: area,
      count: membersWithFlags.length,
      members: membersWithFlags,
      includedAdmins: includeAdmins,
    });

  } catch (error) {
    console.error("Error fetching members for collection:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while fetching members for collection",
      details: error.message,
    });
  }
};

// Public endpoint: get free/attendance-free/funeral-free members for landing page (no auth)
exports.getMembersStatusPublic = async (req, res) => {
  try {
    // Optional limit query param (0 or missing = no limit)
    const limitRaw = parseInt(req.query.limit, 10)
    const limit = Number.isInteger(limitRaw) && limitRaw > 0 ? limitRaw : null

    // Defensive conditions: exclude deactivated/deceased
    const activeDeactivatedCondition = {
      $or: [
        { deactivated_at: { $exists: false } },
        { deactivated_at: null },
        { deactivated_at: { $type: 'string' } }
      ]
    }

    const noDeathCondition = {
      $or: [
        { dateOfDeath: { $exists: false } },
        { dateOfDeath: null }
      ]
    }

    const baseAnd = [activeDeactivatedCondition, noDeathCondition]

    const buildQuery = (statusValue) => ({ status: statusValue, $and: baseAnd })

    const qFree = Member.find(buildQuery('free')).select('member_id name area').sort({ member_id: 1 })
    const qAttendance = Member.find(buildQuery('attendance-free')).select('member_id name area').sort({ member_id: 1 })
    const qFuneral = Member.find(buildQuery('funeral-free')).select('member_id name area').sort({ member_id: 1 })

    if (limit) {
      qFree.limit(limit)
      qAttendance.limit(limit)
      qFuneral.limit(limit)
    }

    // Get total count of all active members (excluding deactivated/deceased)
    const totalActiveQuery = Member.countDocuments({ $and: baseAnd })

    const [freeMembers, attendanceMembers, funeralMembers, totalActiveMembers] = await Promise.all([qFree.exec(), qAttendance.exec(), qFuneral.exec(), totalActiveQuery.exec()])

    res.status(200).json({
      success: true,
      counts: {
        free: freeMembers.length,
        attendanceFree: attendanceMembers.length,
        funeralFree: funeralMembers.length,
        totalActive: totalActiveMembers
      },
      free: freeMembers,
      attendanceFree: attendanceMembers,
      funeralFree: funeralMembers
    })
  } catch (error) {
    console.error('Error fetching free members for landing:', error)
    res.status(500).json({ success: false, error: 'Error fetching free members' })
  }
}

// Get members for collection marking - excludes only free members
exports.getMembersForCollectionMarking = async (req, res) => {
  try {
    const { area } = req.query;

    if (!area) {
      return res.status(400).json({
        success: false,
        error: "Area parameter is required"
      });
    }

    // Be defensive about the shape of deactivated_at in the DB.
    // Exclude any member where deactivated_at is set to a non-empty value.
    // Allow members where deactivated_at is missing, null, or an empty/placeholder string.
    // Build a query that avoids attempting to cast bad string values to Date.
    // Some DB rows mistakenly store strings like "null" in the deactivated_at field
    // which is defined as a Date in the schema. Matching against those raw strings
    // can cause Mongoose to attempt a Date cast and throw. To be defensive we:
    //  - include documents where deactivated_at does not exist
    //  - include documents where deactivated_at is null
    //  - include documents where deactivated_at is stored as a string (invalid but present)
    // This ensures members with invalid deactivated values are treated as "active" for marking.
    // Exclude deactivated or deceased members defensively
    const activeDeactivatedCondition = {
      $or: [
        { deactivated_at: { $exists: false } },
        { deactivated_at: null },
        { deactivated_at: { $type: "string" } }
      ]
    }

    const noDeathCondition = {
      $or: [
        { dateOfDeath: { $exists: false } },
        { dateOfDeath: null }
      ]
    }

    const members = await Member.find({
      area: area,
      status: { $ne: "free" }, // Exclude only free members
      $and: [activeDeactivatedCondition, noDeathCondition]
    })
      .select('member_id name area status roles')
      .sort({ member_id: 1 });

    res.status(200).json({
      success: true,
      area: area,
      count: members.length,
      members: members,
    });

  } catch (error) {
    console.error("Error fetching members for collection marking:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while fetching members for collection marking",
      details: error.message,
    });
  }
};

// Get member details for common work attendance document printing
exports.getMembersForCommonWorkDocument = async (req, res) => {
  try {
    // Get all members (including deactivated and deceased ones to keep blank rows)
    const allMembers = await Member.find({})
      .select("member_id name area status deactivated_at dateOfDeath")
      .sort("member_id");

    // Get officers from the main Admin collection
    const adminDoc = await Admin.findOne({});

    // Extract officer member IDs from the admin document
    const officerMemberIds = new Set();
    if (adminDoc) {
      // Add all main officers (chairman, secretary, etc.)
      const officers = [
        'chairman', 'secretary', 'viceChairman', 'viceSecretary',
        'treasurer', 'loanTreasurer'
      ];

      officers.forEach(role => {
        if (adminDoc[role] && adminDoc[role].memberId) {
          officerMemberIds.add(adminDoc[role].memberId);
        }
      });
    }

    const membersForDocument = allMembers.map((member) => {
      // Check if member is deactivated or deceased
      const isDeactivated = member.deactivated_at != null;
      const isDeceased = member.dateOfDeath != null;

      // Check if member is an officer
      const isOfficer = officerMemberIds.has(member.member_id);

      // For deactivated/deceased members, return blank row structure
      if (isDeactivated || isDeceased) {
        return {
          member_id: member.member_id,
          name: '', // Keep name blank
          area: '', // Keep area blank
          status: isDeactivated ? 'deactivated' : 'deceased',
          isDeactivated: isDeactivated,
          isDeceased: isDeceased,
          isOfficer: false
        };
      }

      return {
        member_id: member.member_id,
        name: member.name,
        area: member.area,
        status: member.status || 'active',
        isDeactivated: false,
        isDeceased: false,
        isOfficer: isOfficer
      };
    });

    res.status(200).json({
      success: true,
      members: membersForDocument
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching member details for common work document.",
      error: error.message,
    });
  }
};

// Get all active members with their due/remaining amounts
exports.getAllMembersDue = async (req, res) => {
    try {
      const currentYear = new Date().getFullYear();
      const monthsToCharge = new Date().getMonth();
      const monthlyBaseRate = await getMonthlyRateForYear(currentYear);
        const startOfYear = new Date(currentYear, 0, 1);

        // Fetch all active members (not deactivated)
        const activeMembers = await Member.find({
            deactivated_at: null
        }).sort({ member_id: 1 }).select('member_id name siblingsCount due2023 fines');

        // Calculate due for each member
        const membersWithDue = await Promise.all(
            activeMembers.map(async (member) => {
                // Calculate membership charge
                let membershipCharge = monthlyBaseRate * monthsToCharge;
                if (member.siblingsCount > 0) {
                  membershipCharge = (monthlyBaseRate * member.siblingsCount * 0.3 + monthlyBaseRate) * monthsToCharge;
                }

                // Get membership payments for current year
                const membershipPayments = await MembershipPayment.find({
                    memberId: member._id,
                    date: { $gte: startOfYear }
                });
                const totalMembershipPaid = membershipPayments.reduce((s, p) => s + (p.amount || 0), 0);
                const membershipDue = membershipCharge - totalMembershipPaid;

                // Calculate fine due
                const fineTotal = member.fines?.reduce((s, f) => s + (f.amount || 0), 0) || 0;
                const finePayments = await FinePayment.find({
                    memberId: member._id,
                    date: { $gte: startOfYear }
                });
                const totalFinePaid = finePayments.reduce((s, p) => s + (p.amount || 0), 0);
                const fineDue = fineTotal - totalFinePaid;

                // Get loan installment if applicable
                const loan = await Loan.findOne({
                    memberId: member._id,
                    loanRemainingAmount: { $gt: 0 }
                }).select('loanDate loanRemainingAmount');

                let loanInstallment = 0;
                if (loan) {
                    const lastIntPayment = await LoanInterestPayment.findOne({
                        loanId: loan._id
                    }).sort({ date: -1 }).select('date');

                    const calculatedInterest = await interestCalculation(
                        loan.loanDate,
                        loan.loanRemainingAmount,
                        lastIntPayment?.date,
                        new Date()
                    );
                    
                    // Only include installment if there are unpaid months
                    if (calculatedInterest?.int > 0 || calculatedInterest?.penInt > 0) {
                        loanInstallment = calculatedInterest.installment || 0;
                    }
                }

                // Add previous due
                const due2023Val = member.due2023 || 0;
                const dueWithoutLoan = membershipDue + fineDue + due2023Val;
                const totalOutstanding = dueWithoutLoan + loanInstallment;

                return {
                    member_id: member.member_id,
                    name: member.name,
                    dueWithoutLoan: dueWithoutLoan,
                    loanInstallment: loanInstallment,
                    totalDue: totalOutstanding
                };
            })
        );

        res.status(200).json({
            success: true,
            members: membersWithDue,
            count: membersWithDue.length
        });
    } catch (error) {
        console.error('Error fetching all members due:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching members due information.',
            error: error.message
        });
    }
};
