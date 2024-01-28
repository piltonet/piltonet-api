const cron = require('node-cron');
const { OracleCoingecko } = require.main.require('./controllers');

const everyMidnight = '00 59 23 * * *';
const everyHour = '0 * * * *';
const every2Mins = '*/2 * * * *';
const every10Secs = '*/10 * * * * *';

function schedule(){
  const schOracles = process.env.NODE_ENV == 'development' ? everyHour : every2Mins;
  cron.schedule(schOracles, () => {
    jobOracles();
  });
}

// async function jobCampaigns(){
//   console.log('Running Campaigns, ', new Date());
//   /************* Get Launched Campaigns *************/
//   var dbLaunchedCampaigns = await models.queries.select_table('campaigns', {
//     campaign_status: 'launched',
//     is_suspended: false
//   });
//   /***************** Start Campaigns *******************/
//   if(dbLaunchedCampaigns.data){
//     for(var campaign of dbLaunchedCampaigns.data) {
//       models.queries.update_table('campaigns', {campaign_status: 'started'}, {id: campaign.id});
//     }
//   }
// }

async function jobOracles(){
  OracleCoingecko.prices();
}

module.exports = {
  schedule
}
