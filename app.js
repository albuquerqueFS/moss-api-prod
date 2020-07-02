const express = require('express');
const app = express();
const morgan = require("morgan");
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const connStr = "Server=svrmoss.database.windows.net;Database=BD2ADSA;User Id=mossadmin;Password=#Gfgrupo8;Encrypt=true";
const sql = require("mssql");

const apiRoutes = require('./api/routes/apis');
const usersRoutes = require('./api/routes/users');
const eventosRoutes = require('./api/routes/eventos');

const defineHosts = require('./api/routes/ping');
const salvarInfo = require('./util');

app.use(cors());
app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});

// app.use((req, res, next) => {
//     const error = new Error("Not found");
//     error.status = 404;
//     next(error);
// });

// app.use((error, req, res, next) => {
//     res.status(error.status || 500);
//     res.json({
//         error: {
//             INFERNO: "DESGRAÇAAAAAAAAAAAAAAAAAAAAAAAAAAA",
//             message: error.message
//         }
//     }); 
// });
 
app.use('/api', apiRoutes);
app.use('/users', usersRoutes);
app.use('/eventos', eventosRoutes);

// REALIZA PINGS
sql.connect(connStr)
   .then(conn => global.conn = conn)
   .then(() => {
        defineHosts(conn)
        .then(resolved => {
            let targetUrls = [];

            resolved.map((api, ind, arr) => {
                targetUrls.push({
                    id_aplicacao: api.aplicacao_id,
                    id_endpoint: api.idEndpoint,
                    targetUrl: api.fullUrl
                });
            });

            pingIt(targetUrls, conn);
        }) 
   })
   .catch(err => console.error(err));

function pingIt(targets, connection) {
    let promises = [];

    // não encosta nessas linhas pelo amor de deus
    for (let x = 0; x < targets.length; x++) {
        promises.push(axios.get(targets[x].targetUrl));
    }

    const promisesResolved = promises.map(promise => promise.catch(error => ({ error })));

    axios.all(promisesResolved)
        .then(axios.spread(function (...res) {

            // console.log({...res});

            // SALVA AS INFORMAÇÕES DOS REQUESTS NO BANCO
            salvarInfo(res, connection);
        }))
        .then(() => {
            setTimeout(() => {
                pingIt(targets, connection)
            }, 5 * 60000);
        });
}

module.exports = app;