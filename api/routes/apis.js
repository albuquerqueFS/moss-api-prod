const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const cors = require('cors');
const encryptHash = 'hashsupersecreta';

// Testando a dependencia mssql
const connStr = "Server=svrmoss.database.windows.net;Database=BD2ADSA;User Id=mossadmin;Password=#Gfgrupo8;Encrypt=true";
const sql = require("mssql");
const { resolve } = require('path');

//fazendo a conexão global
sql.connect(connStr)
   .then(conn => global.conn = conn)
   .catch(err => console.error(err));


// rotas para operações na tabela Api
router.get('/', (req, res, next) => {
    console.log('SELECT * FROM Api');
    SQLQuery().execute('SELECT * FROM Api', res);
});

router.get('/:hash', (req, res) => {
    if (req.params.hash) {
        const idHash = req.params.hash;
        SQLQuery().execute(`SELECT * FROM Api WHERE appHash='${idHash}'`, res);
    }
});

router.get('/create/:name/:website', (req, res) => {
    var data = {
        "create": {
            "name": req.params.name,
            "website": req.params.website
        }
    };
    const appHash = crypto.createHmac('sha256', encryptHash)  
                    .update(Date.now() + data.create.name.substring(0, 5))  
                    .digest('hex');  

    if (!data.create.name || !data.create.website) {
        res.status(500).json({
            message: 'Preencha todos os campos!'
        });
    } else {
        SQLQuery().selectHandler(`SELECT * FROM Api WHERE website='${data.create.website}'`, results => {
            if (results.recordsets[0].length > 0) {
                res.status(403).json({
                    message: 'Ja existe uma api com a url especificada.'
                });
            } else {
                SQLQuery().execute(`INSERT INTO Api(appHash, nome, website) VALUES('${appHash}', '${data.create.name}', '${decodeURIComponent(data.create.website)}')`, res);
            }
        });
    }   
});

// router.post('/', (req, res, next) => {
//     const nome = req.body.nome.substring(0, 50);
//     const website = req.body.website.substring(0, 150);
//     const appHash = crypto.createHmac('sha256', encryptHash)  
//                     .update(Date.now() + nome.substring(0, 10))  
//                     .digest('hex');  

//     if (!nome || !website) {
//         res.status(500).json({
//             message: 'Preencha todos os campos!'
//         });
//     } else {
//         SQLQuery().selectHandler(`SELECT * FROM Api WHERE website='${website}'`, results => {
//             if (results.recordsets[0].length > 0) {
//                 res.status(403).json({
//                     message: 'Ja existe uma api com a url especificada.'
//                 });
//             } else {
//                 SQLQuery().execute(`INSERT INTO Api(appHash, nome, website) VALUES('${appHash}', '${nome}', '${website}')`, res);
//             }
//         });
//     }   
// });

router.patch('/:hash', (req, res) => {
    if (req.params.hash) {
        const nome = req.body.nome.substring(0, 50);
        const website = req.body.website.substring(0, 150);
        const idHash = req.params.hash;
        SQLQuery().execute(`UPDATE Api SET nome='${nome}', website='${website}' WHERE appHash=${idHash}`, res);
    }
});

router.delete('/:hash', (req, res) => {
    if (req.params.hash) {
        SQLQuery().execute(`DELETE FROM Api WHERE appHash= '${req.params.hash}'`, res);
    }
});


// rotas para operações na tabela Endpoint
router.get('/:hash/endpoint', (req, res, next) => {
    if (req.params.hash) {
        const fatherHash = req.params.hash;
        SQLQuery().execute(`SELECT * FROM Endpoint WHERE aplicacao_hash='${fatherHash}'`, res);
    }
});

router.post('/:hash/endpoint', (req, res, next) => {
    if (req.params.hash) {
        const url = req.body.url;
        const fatherHash = req.params.hash;
        SQLQuery().selectHandler(`SELECT * FROM Endpoint WHERE url='${url}'`, results => {
            if (results.recordsets[0].length > 0) {
                res.status(403).json({
                    message: 'Esta rota ja existe'
                });
            } else {
                SQLQuery().selectHandler(`SELECT idApp FROM Api WHERE appHash='${fatherHash}'`, results => {
                    const fatherID = results.recordsets[0][0].idApp
                    SQLQuery().execute(`INSERT INTO Endpoint(url, requestType, aplicacao_id, aplicacao_hash) VALUES('${url}', 'NULL', '${fatherID}', '${fatherHash}')`, res);
                });
            }
        });
    }
});

router.patch('/:hash/endpoint/:idEndpoint', (req, res) => {
    if (req.params.hash && req.params.idEndpoint) {
        const url = req.body.url;
        const fatherHash = req.params.hash;
        const idEndpoint = req.params.idEndpoint;
        SQLQuery().selectHandler(`SELECT * FROM Endpoint WHERE url='${url}'`, results => {
            if (results.recordsets[0].length > 0) {
                res.status(403).json({
                    message: 'Usuário digitou a mesma coisa que ja esta cadastrada.'
                });
            } else {
                SQLQuery().execute(`UPDATE Endpoint SET url='${url}' WHERE idEndpoint=${idEndpoint} AND aplicacao_hash='${fatherHash}'`, res);
            }
        });
    }
});

router.delete('/:hash/endpoint/:idEndpoint', (req, res) => {
    if (req.params.hash && req.params.idEndpoint) {
        const fatherHash = req.params.hash;
        const idEndpoint = req.params.idEndpoint;
        SQLQuery().selectHandler(`DELETE FROM Endpoint WHERE idEndpoint=${idEndpoint} AND aplicacao_hash='${fatherHash}'`, res);
    }    
});

// results.recordsets[0].length > 0
const SQLQuery = () => {
    return {
        execute: (query, res) => {
        sql.connect(connStr)
        .then(conn => conn.request()
                        .query(query)
                        .then(result => res.status(200).json({
                            retorno: result,
                            getResponse: result.recordsets[0]
                        })
                        .catch(err => res.status(500).json({
                                message: 'Erro no servidor',
                                erro: err
                            })
                        )) 
        )
        .catch(err => console.error(err));
            
        }, 
        selectHandler: (query, returnFN) => {
            global.conn.request()
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

module.exports = router;