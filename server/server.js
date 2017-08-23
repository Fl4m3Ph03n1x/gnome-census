const HTTPStatus = require("http-status");
const express = require("express");
const request = require("request");
const promisify = require("util").promisify;
const gender = require("gender-guess");
const HTTPGet = promisify(request);

const CONFIG_PATH = "./config.json";

module.exports = function() {
    const app = express();
    const config = require( CONFIG_PATH );
    const { dbConnectionURL, pagination } = config;

    const normalize = input =>
        Array.isArray(input) ? input.map(item => item.toLowerCase().trim()) : input.toLowerCase().trim();

    //Allow CORS!
    app.use( (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });

    /*
     * Ideally I would return an HTML explaining how to use this API with
     * examples and all that jazz
     */
    app.get("/", (req, res) => {
        res.send("Usage of the API is /api/v1/gnomes/");
    });

    app.get("/api/v1/gnomes/", (req, res) => {

        //lets imagine this is a request to a database
        HTTPGet( dbConnectionURL )
            .then(data => {
                /*
                 * Now we process the data !
                 * If using a real database I would be using Mongoose, but since
                 * this is just a prototype I just go ahead and mess with arrays
                 */
                let matchingEntries = JSON.parse(data.body).Brastlewark;

                const responseObj = {};
                responseObj.entries = [];
                responseObj.totalPages = 1;

                try {
                    if (req.query.id) {
                        const gnomeId = +normalize(req.query.id);

                        //Using Filter to allow compatibility with the other
                        //search options
                        matchingEntries = matchingEntries.filter( gnome => gnome.id === gnomeId );
                    }

                    if (req.query.professions) {
                        const inputProfessions = normalize(req.query.professions.split(","));
                        let gnomeProfessions;

                        matchingEntries = matchingEntries.filter( gnome => {
                            gnomeProfessions = normalize(gnome.professions);
                            return inputProfessions.every(inputProfessions, prof => gnomeProfessions.includes( prof ) );
                        });
                    }

                    //Our heroes may have a fetiche of some kind ... don't ask me ...
                    if (req.query.hairColor) {
                        const hairColor = normalize(req.query.hairColor);
                        matchingEntries = matchingEntries.filter( gnome => normalize(gnome.hair_color) === hairColor );
                    }
                }
                catch (Exception) {
                    res.status(HTTPStatus.INTERNAL_SERVER_ERROR);
                    res.send(JSON.stringify({
                        code: HTTPStatus.INTERNAL_SERVER_ERROR,
                        message: "The server crashed into a horrible death while filtering your request",
                        info: Exception
                        //Ideally, would also add URL for extra documentation.
                    }));
                    return;
                }

                // or I could use _.isEmpty(result)
                if (matchingEntries.length === 0) {
                    res.status(HTTPStatus.NOT_FOUND);
                    res.send(JSON.stringify({
                        code: HTTPStatus.NOT_FOUND,
                        message: "The resource you were looking for was not found"
                        //Ideally, would also add URL for extra documentation.
                    }));
                    return;
                }

                let pageNum = +(req.query.page || 1);
                const itemsPerPage = +(req.query.itemsPerPage || pagination.itemsPerPage);

                if (itemsPerPage < 1 || pageNum < 1) {
                    res.status(HTTPStatus.BAD_REQUEST);
                    res.send(JSON.stringify({
                        code: HTTPStatus.BAD_REQUEST,
                        message: "The pagination parameters are incorrect. All pagination parameters must be > 0.",
                    }));
                    return;
                }

                const dividedArray = [];
                while (matchingEntries.length) {
                    dividedArray.push(matchingEntries.splice(0, itemsPerPage));
                }

                pageNum = pageNum > dividedArray.length ? dividedArray.length - 1 : pageNum - 1;
                responseObj.entries = dividedArray[pageNum];

                //only guess the name for the entries the client will see
                for(const gnome of responseObj.entries){
                    gnome.gender = gender.guess(gnome.name);
                }

                responseObj.totalPages = dividedArray.length;
                responseObj.itemsPerPage = itemsPerPage;

                res.send(responseObj);
            })
            .catch((Exception) => {
                res.status(HTTPStatus.INTERNAL_SERVER_ERROR);
                res.send(JSON.stringify({
                    code: HTTPStatus.INTERNAL_SERVER_ERROR,
                    message: "The server found unknown problems while processing the request",
                    info: Exception
                    //Ideally, would also add URL for extra documentation.
                }));
                //We would write this into a log file for later evaluation
                console.error(Exception);
            });
    });

    return app;
};
