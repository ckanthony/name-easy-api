const { TokenizerEn, StemmerEn, StopwordsEn } = require('@nlpjs/lang-en');
const synonyms = require('synonyms');
const Wordpos = require('wordpos');
const axios = require('axios');
const _ = require('underscore');
const wordpos = new Wordpos();

const tokenizer = new TokenizerEn();
const stemmer = new StemmerEn();
const stopwords = new StopwordsEn();

const naming = async function (mission) {
  try {
    const tokens = tokenizer.tokenize(mission, true);
    console.log(`input: ${mission}`)
    console.log('==>')
    console.log(tokens)
    const missionClean = stopwords.removeStopwords(tokens, false);
    if (missionClean.length === 0) { return false; }
    console.log(missionClean)
    const test = await wordpos.getPOS(missionClean)
    console.log(test)

    let pureVerbs = test.verbs;
    test.adjectives.forEach(a => {
      pureVerbs = pureVerbs.filter(item => item !== a);
    });
    let verbNouns = [];
    pureVerbs.forEach(v => {
      if (test.nouns.includes(v)) {
        verbNouns.push(v);
      }
    });
    verbs = test.adjectives.concat(pureVerbs).concat(verbNouns);
    verbs = [...new Set(verbs.reverse())].reverse();
    ['company', 'mission', 'world', 'become'].forEach(stop => {
      verbs = verbs.filter(item => item !== stop);
    })
    if (verbs.length === 0) { return false; }
    console.log(`verbs ${verbs}`)
    // const refine = stemmer.stem(verbs);
    // console.log(refine)
    let results = await Promise.all(
      verbs.map(async r => await getSynonymsAtThesaurus(r))
    );
    const list = results.flat().filter(x => x !== false);
    if (!list.length) { return false; }
    return list.map(l => ({ verb: l.verb, result: `i${l.result[i].charAt(0).toUpperCase() + l.result[i].slice(1)}U` }));
  } catch (e) {
    console.error(e);
    return false; 
  }
}

async function thesearch(query) {
    const url = 'https://api.datamuse.com/words?rel_syn=' + encodeURIComponent(query);
    const results = await axios.get(url);
    if (results.status !== 200) { return []; }
    return results.data.map(r => r.word);
}

const getSynonymsAtThesaurus = async function (word) {
  const result = await thesearch(word);
  console.log(`synonyms:`, result)
  if (!result || !result.length) { return getSynonyms(word); }
  const candidates = result.filter(item => !item.includes(' '));
  candidates.push(word);
  return _.shuffle(candidates.map(c => ({ verb: word, result: c })));
}

const getSynonyms = function (word, p = null) {
  const results = synonyms(word);
  console.log(`testing: ${word}, results:`, results)
  if (!results || !results.v) { return false; }
  if (results.v.length > 1) {
    results.v = results.v.filter(item => item !== word)
  }
  if (results.v.includes('v')) {
    if (results.n.includes('n')) {
      return false;
    }
    tryNouns = results.n.filter(item => item !== word);
    if (tryNouns.join().localeCompare(p) === 0) {
      return false;
    }
    let candidates = tryNouns.map(n => getSynonyms(n, tryNouns.join()));
    candidates = candidates.filter(item => item !== false);
    console.log(candidates)
    if (candidates.length > 0) {
      return candidates.map(c => ({ verb: word, result: c }));
    }
    return [{ verb: word, result: `i${word}U` }];
  }
  console.log(results)
  return _.shuffle(results.v.map(v => ({ verb: word, result: v })));
}

module.exports = naming;