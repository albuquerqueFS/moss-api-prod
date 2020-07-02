const knex = require('knex');

const connection = knex({
  client: 'mssql',
  connection: {
    host: 'svrmoss.database.windows.net',
    user: 'mossadmin',
    password: '#Gfgrupo8',
    database: 'BD2ADSA',
    options: {
      enableArithAbort: true,
    }
  }
});

module.exports = connection;