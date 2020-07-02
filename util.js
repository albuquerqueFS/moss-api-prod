const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const { query } = require('express');

function salvarInfo(pingResponse, connection) {
    return new Promise((resolve, reject) => {
        let hosts = [];
        let date_obj = new Date();

        SQLQuery().selectHandler(`SELECT * FROM Endpoint`, connection, queryResult => {
            pingResponse.forEach(val => {
                targetUrl = val.config != undefined ? val.config.url : val.error.config.url;
                let x = 0;

                if (queryResult.recordset != undefined) {
                    queryResult.recordset.map((api, ind, arr) => {
    
                        if (targetUrl.includes(api.url)) {

                            SQLQuery().selectHandler(`SELECT * FROM Eventos WHERE id_endpoint = ${api.idEndpoint} ORDER BY idLog DESC`, 
                            connection, 
                            queryResult => {
                                if (queryResult.recordset[0].statusCode == 200 &&
                                    queryResult.recordset[1].statusCode == 200 &&
                                    queryResult.recordset[2].statusCode == 200) {
                                        SQLQuery().execute(`INSERT INTO Eventos (mensagem, statusCode, tempoOffline, dateAt, timeAt, id_endpoint) VALUES (
                                            'NONE',
                                            404,
                                            ${0},
                                            '${date_obj.toLocaleDateString().split('-')[0]}/${date_obj.toLocaleDateString().split('-')[1]}/${date_obj.toLocaleDateString().split('-')[2]}',
                                            '${date_obj.getHours()}:${date_obj.getMinutes()}:${date_obj.getSeconds()}',
                                            ${api.idEndpoint}
                                        );`, connection, res => {});
                                } else {
                                    SQLQuery().execute(`INSERT INTO Eventos (mensagem, statusCode, tempoOffline, dateAt, timeAt, id_endpoint) VALUES (
                                        'NONE',
                                        ${val.status || 404},
                                        ${0},
                                        '${date_obj.toLocaleDateString().split('-')[0]}/${date_obj.toLocaleDateString().split('-')[1]}/${date_obj.toLocaleDateString().split('-')[2]}',
                                        '${date_obj.getHours()}:${date_obj.getMinutes()}:${date_obj.getSeconds()}',
                                        ${api.idEndpoint}
                                    );`, connection, res => {});
                                }
                            });
                        }
                    });
                }
            });
        });
    });
}

// results.recordsets[0].length > 0
const SQLQuery = () => {
    return {
        execute: (query, connection, res) => {
            connection.request()
                        .query(query)
                        .then(result => {
                            return res(result);
                        })
                        .catch(err => {
                            return res(err);
                        });
        }, 
        selectHandler: (query, connection, returnFN) => {
            connection.request()
                        .query(query)
                        .then(result => {
                            return returnFN(result);
                        })
                        .catch(err => {
                            return returnFN(err);
                        });
        }
    }
}

module.exports = salvarInfo;