const express = require('express');
const cheerio = require('cheerio');
const nlp = require('compromise');
const nlpPronounce = require('compromise-pronounce');
const randomUseragent = require('random-useragent');
const axios = require('axios');

nlp.extend(nlpPronounce);

const rua = randomUseragent.getRandom();
const app = express();

const splitHtml = (responseData, removeSpecialChars) => {
    $ = cheerio.load(responseData);

    const post = $('.section #shared_section');
    const word = post.find('#random_word').eq(0).text().replace('\r\n\t\t\t\t\t', '').replace('\r\n\t\t\t\t', '').replace('\n\t\t\t\t\t', '').replace('\n\t\t\t\t', '');
    const definition = post.find('#random_word_definition').eq(0).text().replace('\n', '');
    const pronounceword = word;
    const doc = nlp(pronounceword);
    const pronounces = doc.terms().pronounce().map(o => o.pronounce).toString();
    const pronounce = pronounces.replace(",", "");
    
    if (removeSpecialChars) {
        const specialChars = /["\\.,?'-]/g

        return {
            word: word ? word.replace(specialChars, '') : '',
            pronounce: pronounce ? pronounce.replace(specialChars, '') : '',
            definition: definition ? definition.replace(specialChars, '') : ''
        }
    }

    return {
        word,
        pronounce,
        definition
    }
} 


const addHeaders = (res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers,Content-Type,Access-Control-Allow-Methods, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('Strict-Transport-Security', 'max-age=63072000');
    res.setHeader('Content-Type', 'application/json');
} 

app.get('/', (req, res) => {
    addHeaders(res)
    app.disable('x-powered-by');

    res.json('Random Words API');
});

app.get('/word', (req, res) => {
    addHeaders(res)
    app.disable('x-powered-by');

    axios({
        method: 'GET',
        url: 'https://randomword.com/',
        headers: {
            'User-Agent': rua
        }
    }).then(function(response) {
        let wordOfDay = [];

        $ = cheerio.load(response.data);

        if (wordOfDay.length > 0) {
            wordOfDay = [];
        }

        const { word, definition, pronounce } = splitHtml(response.data)
        
        wordOfDay.push({
            word: decodeURI(word.charAt(0).toUpperCase() + word.slice(1)),
            definition: decodeURI(definition.charAt(0).toUpperCase() + definition.slice(1)),
            pronunciation: decodeURI(pronounce.charAt(0).toUpperCase() + pronounce.slice(1))
        })

        console.log("User-Agent:", rua);
        res.send(JSON.stringify(wordOfDay, null, 2));
        console.log(wordOfDay);
    }).catch(function(error) {
        console.log(error)
        if (!error.response) {
            console.log('API URL is Missing');
            res.json('API URL is Missing');
        } else {
            console.log('Something Went Wrong - Enter the Correct API URL');
            res.json('Something Went Wrong - Enter the Correct API URL');
        }
    });

});


app.use('/paragraph', (req, res) => {
    addHeaders(res)
    app.disable('x-powered-by');

    axios({
        method: 'GET',
        url: 'https://randomword.com/paragraph',
        headers: {
            'User-Agent': rua
        }
    }).then((response) => {
        $ = cheerio.load(response.data);

        const { word, definition, pronounce } = splitHtml(response.data, true)
        
        const paragraphOfDay = [{
            word: decodeURI(word.charAt(0).toUpperCase() + word.slice(1)),
            definition: decodeURI(definition.charAt(0).toUpperCase() + definition.slice(1)),
            pronunciation: decodeURI(pronounce.charAt(0).toUpperCase() + pronounce.slice(1))
        }]

        console.log("User-Agent:", rua);
        res.send(JSON.stringify(paragraphOfDay, null, 2));
    }).catch((error) => {
        console.log('Something went wrong', error)
    });
})

app.use('/', (req, res) => {
    res.status(404).json({
        error: 1,
        message: 'Not Found'
    });
});

// start app on localhost port 3000
var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log('listening on port ' + port);
});