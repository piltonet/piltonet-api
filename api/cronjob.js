const cron = require('node-cron');
const { OracleCoingecko } = require.main.require('./controllers');

function schedule(){
  // cron.schedule('00 59 23 * * *', () => { // every day at midnight
  //   jobCampaigns();
  // });
  cron.schedule('* * * * *', () => { // every minute
  // cron.schedule('*/10 * * * * *', () => { // every 10 seconds
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
