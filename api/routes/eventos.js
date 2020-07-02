const express = require('express');
const router = express.Router();
const cors = require('cors');

// Testando a dependencia mssql
const connStr = "Server=svrmoss.database.windows.net;Database=BD2ADSA;User Id=mossadmin;Password=#Gfgrupo8;Encrypt=true";
const sql = require("mssql");
   
router.get('/', (req, res, next) => {
    selectHandler('SELECT * FROM Eventos', res);
});

router.get('/:endpoint', (req, res) => {
    selectHandler(`SELECT CAST(dateAt AS DATETIME) + CAST(timeAt AS DATETIME) AS horaGravacao, * FROM [dbo].[Eventos] WHERE id_endpoint = ${req.params.endpoint};`, req.params.endpoint, res);
});

// router.get('/:endpoint', (req, res) => {
//     selectFullData(`SELECT * FROM Eventos WHERE id_endpoint=${req.params.endpoint}`, res);
// });

function getConnection() {
    return new Promise((resolve, reject) => {
        sql.connect(connStr)
        .then(conn => resolve(conn))
        .catch(err => reject(err));
    }, 
    reject => {
        console.log(reject);
    })
}

function selectHandler(query, endpoint, res) {
    getConnection()
    .then(connection => {
        connection.request()
        .query(query)
        .then(result => {
            
            connection.request()
            .query(`SELECT 
            (SELECT COUNT(statusCode) AS positivosHoje 
            FROM [dbo].[Eventos] 
            WHERE id_endpoint = ${endpoint} AND statusCode = 200 AND DAY(dateAt) = DAY(GETDATE()) AND MONTH(dateAt) = MONTH(GETDATE())
            ) AS positivosHoje,  
            (SELECT COUNT(statusCode) AS errosHoje 
            FROM [dbo].[Eventos] 
            WHERE id_endpoint = ${endpoint} AND statusCode = 404 AND DAY(dateAt) = DAY(GETDATE()) AND MONTH(dateAt) = MONTH(GETDATE())
            ) AS errosHoje`)
            .then(resultB => {
                connection.request()
                .query(`SELECT * FROM [dbo].[Eventos] WHERE id_endpoint = ${endpoint} AND DAY(dateAt) = DAY(GETDATE()) AND MONTH(dateAt) = MONTH(GETDATE()) ORDER BY idLog DESC`)
                .then(resultC => {
                    res.status(200).json({
                        retorno: result,
                        getResponse: result.recordsets[0],
                        count: resultB.recordsets[0],
                        tempoOffline: resultC.recordsets[0] == "" ? '00h00' : resultC.recordsets[0]
                    })
                })
                .catch(error => console.log(error))
            })
        })
        .catch(err => res.status(500).json({
                message: 'Erro no servidor',
                erro: err
            })
        )
    }, 
    reject => {
        console.log(reject);
    })
}

module.exports = router;