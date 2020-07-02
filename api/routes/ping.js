const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const ping = require('ping');
const cors = require('cors');

// Testando a dependencia mssql
const connStr = "Server=svrmoss.database.windows.net;Database=BD2ADSA;User Id=mossadmin;Password=#Gfgrupo8;Encrypt=true";
const sql = require("mssql");

//fazendo a conexão global
sql.connect(connStr)
   .then(conn => global.conn = conn)
   .then(() => {
       
   })
   .catch(err => console.error(err));

function execute(query, res) {
    global.conn.request()
        .query(query)
        .then(result => res.status(200).json({
            retorno: result,
            getResponse: result.recordsets[0]
        })
        .catch(err => res.status(500).json({
                message: 'Erro no servidor',
                erro: err
            })
        ));
}

function selectHandler(query, connection, returnFN) {
    connection.request()
                .query(query)
                .then(result => {
                    return returnFN(result);
                })
                .catch(err => {
                    return returnFN(err);
                });
}

function defineHosts(connection) {
    return new Promise((resolve, reject) => {
        let hosts = [];

        selectHandler(`SELECT * FROM Api`, connection, response => {
            var returnWhen = 0;
            let endpointArrays = [];
            let targetHosts = [];

            hosts = response.recordset;
            hosts.forEach(api => {
                selectHandler(`SELECT * FROM Endpoint WHERE aplicacao_id=${api.idApp}`, connection, secondResponse => {

                    endpointArrays = secondResponse.recordset != undefined ? secondResponse.recordset : [];

                    endpointArrays.map((val, ind, arr) => {
                        if (val.aplicacao_id == api.idApp) {

                            targetHosts.push({
                                ...val,
                                fatherId: api.idApp, 
                                fullUrl: api.website + val.url
                            });
                        }
                    });

                    returnWhen++;

                    if (returnWhen == hosts.length) {
                        resolve(targetHosts);
                    }
                })
            });
        });
    });
}

module.exports = defineHosts;