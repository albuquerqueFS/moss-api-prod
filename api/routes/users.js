const express = require('express');
const router = express.Router();
const knex = require('../../connection.js');
const cors = require('cors');

// const crypto = require('crypto');
// const encryptHash = 'hashsupersecreta';

// Testando a dependencia mssql
// const connStr = "mssql://mossadmin:#Gfgrupo8@svrmoss.database.windows.net/BD2ADSA";
const connStr = "Server=svrmoss.database.windows.net;Database=BD2ADSA;UserId=mossadmin;Password=#Gfgrupo8;Encrypt=true";
const sql = require("mssql");

//fazendo a conexão global
sql.connect(connStr)
    .then(conn => global.conn = conn)
    .catch(err => console.error(err));

let sessoes = [];


router.get('/', cors(), async (req, res, next) => {
    const query = await knex.raw('SELECT * FROM Squads');
    // SQLQuery().execute('SELECT * FROM Squads', res);
    res.json(query);
});

router.get('/:idSquad', cors(), async (req, res) => {
    if (req.params.idSquad) {
        const idSquad = req.params.idSquad;
        console.log(idSquad);
        const query = await knex.raw(`SELECT * FROM Squads WHERE idSquad=${idSquad}`);
        res.json(query);
    }
});

// router.post('/', (req, res) => {
//     const login = req.body.login;
//     const senha = req.body.senha

//     SQLQuery().selectHandler(`SELECT * FROM Squads WHERE login='${login}' && senha='${senha}'`, results => {
//         if (results.recordsets[0].length > 0) {
//             res.status(403).json({
//                 message: 'Usuário já cadastrado.'
//             });
//         } else {
//             SQLQuery().execute(`INSERT INTO Squads(login, senha) VALUES('${login}', '${senha}')`, res);
//         }
//     });

//     return res.json(login, senha);
// })

// router.get('/autenticar', (req, res, next) => {
//     const login = req.params.login;
//     const senha = req.params.senha;
//     SQLQuery().execute(`SELECT * FROM Squads WHERE login='${login}' && senha='${senha}'`, res)
//         .then(resultado => {
//             console.log(`Encontrados: ${resultado.length}`);

//             if (resultado.length == 1) {
//                 sessoes.push(resultado[0].dataValues.login); //mudei de login para email
//                 console.log('sessoes: ', sessoes);
//                 res.json(resultado[0]);
//             } else if (resultado.length == 0) {
//                 res.status(403).send('Login e/ou senha inválido(s)');
//             } else {
//                 res.status(403).send('Mais de um usuário com o mesmo login e senha!');
//             }

//         }).catch(erro => {
//             console.error(erro);
//             res.status(500).send(erro.message);
//         });
// })

router.post('/autenticar', cors(), (req, res, next) => {
    console.log('Recuperando usuário por login e senha');
    const login = req.body.login;
    const senha = req.body.senha;

    knex.raw(`SELECT * FROM Squads WHERE login='${login}' and senha='${senha}'`)
        .then(resultado => {
            console.log(`Encontrados: ${resultado.length}`);

            if (resultado.length == 1) {
                sessoes.push(resultado[0].login); 
                console.log('sessoes: ', sessoes);
                res.json(resultado[0]);
            } else if (resultado.length == 0) {
                res.status(403).send('Login e/ou senha inválido(s)');
            } else {
                res.status(403).send('Mais de um usuário com o mesmo login e senha!');
            }

        }).catch(erro => {
            console.error(erro);
            res.status(500).send(erro.message);
        });
})

router.post('/cadastrar', cors(), (req, res, next) => {
    const login = req.body.login;
    const senha = req.body.senha;

    if (!login || !senha) {
        res.status(500).json({
            message: 'Preencha todos os campos!'
        });
    } else {
        knex.raw(`SELECT * FROM Squads WHERE login='${login}'`).then(results => {
            if (results.length > 0) {
                res.status(403).json({
                    message: 'Usuário já cadastrado.'
                });
            } else {
                knex.raw(`INSERT INTO Squads(login, senha) VALUES('${login}', '${senha}')`)
                .then(results => {
                    console.log(results);
                    res.status(200).send();
                    
                    
                }
                );
            }
        })
    }
});

// results.recordsets[0].length > 0
// const SQLQuery = () => {
//     return {
//         execute: (query, res) => {
//         sql.connect(connStr)
//         .then(conn => conn.request()
//                         .query(query)
//                         .then(result => res.status(200).json({
//                             retorno: result,
//                             getResponse: result.recordsets[0]
//                         })
//                         .catch(err => res.status(500).json({
//                                 message: 'Erro no servidor',
//                                 erro: err
//                             })
//                         )) 
//         )
//         .catch(err => console.error(err));
            
//         }, 
//         selectHandler: (query, returnFN) => {
//             global.conn.request()
//                         .query(query)
//                         .then(result => {
//                             return returnFN(result);
//                         })
//                         .catch(err => {
//                             return returnFN(err);
//                         });
//         }
//     }
// }

module.exports = router;