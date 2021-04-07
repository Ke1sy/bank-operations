const moment = require('moment');
const fs = require('fs').promises;
const inputFile = process.argv[2]; // 0 - node path, 1 - file path , 2 - 1st argument

const COMMISSIONS = {
  cashIn: {
    percents: 0.03,
    maxCommission: 5
  },

  cashOut: {
    natural: {
      percents: 0.3,
      weekLimit: 1000
    },
    juridical: {
      percents: 0.3,
      minCommission: 0.5
    },
  }
};

const OPERATION_TYPES = {
  cashIn: 'cash_in',
  cashOut: 'cash_out',
};

const USER_TYPES = {
  natural: 'natural',
  juridical: 'juridical',
};

if (inputFile) {
  initBankOperations(inputFile);
} else {
  console.error('Input file not selected')
}

async function initBankOperations(file) {
  const fileData = await getData(file);
  const commissionsResult = [];

  if (fileData) {
    const formattedData = fileData.map(obj => ({...obj, year: moment(obj.date).format('YYYY'), week: moment(obj.date, "YYYY-MM-DD").isoWeek()}));
    const usersObj = {};

    formattedData.forEach(obj => {
      const {user_id, week, type, operation: {amount}, user_type, year} = obj;

      //sorting data for each user for each year and week

      if (!usersObj[user_id]) {
        usersObj[user_id] = {}
      }

      if (!usersObj[user_id][year]) {
        usersObj[user_id][year] = {}
      }

      if (!usersObj[user_id][year][week]) {
        usersObj[user_id][year][week] = {
          cashOutTotal: 0,
        }
      }

      if (type === OPERATION_TYPES.cashIn) {
        const {percents, maxCommission} = COMMISSIONS.cashIn;
        commissionsResult.push(calculateCommission(amount, percents, null, maxCommission));
      } else if (type === OPERATION_TYPES.cashOut) {
        if (user_type === USER_TYPES.natural) {
          const {percents, weekLimit} = COMMISSIONS.cashOut.natural;
          let commission;
          const availableWeekLimit = weekLimit - usersObj[user_id][year][week]['cashOutTotal'];
          if (availableWeekLimit > 0) {
            const taxSum = amount - weekLimit;
            commission = taxSum > 0 ? calculateCommission(taxSum, percents) : '0.00';
          } else {
            commission = calculateCommission(amount, percents);
          }
          commissionsResult.push(commission)
        } else if (user_type === USER_TYPES.juridical) {
          const {percents, minCommission} = COMMISSIONS.cashOut.juridical;
          commissionsResult.push(calculateCommission(amount, percents, minCommission))
        } else {
          //todo here can be extended
        }
      } else {
        //todo here can be extended
      }

      usersObj[user_id][year][week]['cashOutTotal'] += amount;

    });
  }

  commissionsResult.forEach(c => console.log(c));

  return commissionsResult;
}

const calculateCommission = (amount, percent, minValue = null, maxValue = null) => {
  let commission = amount * percent / 100;
  if (minValue) {
    commission = commission >= minValue ? commission : minValue
  } else if (maxValue) {
    commission = commission >= maxValue ? maxValue : commission
  }
  return (Math.ceil(commission * 100) / 100).toFixed(2);
};

async function getData(file) {
  try {
    const data = await fs.readFile(file);
    return JSON.parse(data);
  } catch (err) {
    console.error(err);
    return null;
  }
}

module.exports = initBankOperations;
