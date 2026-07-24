/**
 * 3. OntologyResolver — 질문에 언급된 표현을 ontology/entities.yaml의 Entity로 매핑.
 * "딜러사"→Dealer, "SC"→SalesConsultant 같은 매핑. ontology/business_vocabulary.yaml의
 * synonyms/excluded_meanings를 사전으로 쓴다 (LLM 자유 추론이 아니라 사전 조회 우선).
 */
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

const ROOT = path.resolve(__dirname, "..", "..", "..");
let vocabCache = null;
function loadVocab() {
  if (vocabCache) return vocabCache;
  const doc = yaml.load(fs.readFileSync(path.join(ROOT, "ontology/business_vocabulary.yaml"), "utf8"));
  vocabCache = doc.terms || [];
  return vocabCache;
}

async function ontologyResolver(state) {
  const q = state.normalizedQuestion || state.userQuestion;
  const vocab = loadVocab();
  const matched = [];
  for (const term of vocab) {
    const candidates = [term.canonical_name_ko, ...(term.synonyms || [])];
    if (candidates.some((c) => c && q.includes(c))) {
      matched.push({ term_id: term.term_id, entities: term.related_entities || [], matched_text: term.canonical_name_ko });
    }
  }
  return { ...state, resolvedEntities: [...state.resolvedEntities, ...matched] };
}

module.exports = { ontologyResolver };
