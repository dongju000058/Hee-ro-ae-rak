(() => {
  const gap = '[^가-힣ㄱ-ㅎㅏ-ㅣa-z]*';
  const spaced = word => Array.from(word).join(gap);
  const words = ['씨발','씨빨','시빨','씨바','씹새','개새끼','개새키','개색기','병신','븅신','빙신','좆','존나','좃나','좆까','꺼져','닥쳐','지랄','엿먹어'];
  const initials = ['ㅅㅂ','ㅆㅂ','ㅂㅅ','ㅄ','ㅈㄹ','ㅈㄴ','ㄲㅈ','ㄷㅊ'];
  const pattern = [
    'ㅈ' + gap + '[같가까]',
    ...words.map(spaced),
    spaced('시발') + '([^점]|$)',
    ...initials.map(spaced),
    ...[
      ['[씨시ㅆㅅ]','[발빨ㅂ]'], ['[병븅빙ㅂ]','[신ㅅ]'],
      ['[지ㅈ]','[랄ㄹ]'], ['[존좃좆ㅈ]','[나ㄴ]'],
      ['[꺼ㄲ]','[져ㅈ]'], ['[닥ㄷ]','[쳐ㅊ]'],
      ['개','[새색ㅅ]','[끼키기ㄲㄱ]'], ['씹','[새ㅅ]']
    ].map(parts => parts.join(gap)),
    '(^|[^a-z])f' + gap + 'u' + gap + 'c' + gap + 'k(?:ing|er|ers)?($|[^a-z])',
    '(^|[^a-z])' + spaced('shit') + '($|[^a-z])',
    '(^|[^a-z])' + spaced('bitch') + '($|[^a-z])'
  ].join('|');
  const matcher = new RegExp(pattern, 'i');
  const englishWords = ['fuck','fucking','fucker','fuckers','fucked','motherfucker',
    'motherfucking','shit','shitty','bullshit','bitch','bitches','bastard','asshole',
    'assholes','dick','dickhead','cunt','cock','pussy','stfu','wtf',
    'sibal','ssibal','shibal','gaesaekki','byeongsin'];
  const english = new RegExp('(^|[^a-z])(?:' + englishWords.map(word =>
    Array.from(word).map(c => ({a:'[a@4]',i:'[i!1|]',o:'[o0]',s:'[s$5]',t:'[t7]',e:'[e3]'}[c] || c)).join(gap)
  ).join('|') + ')($|[^a-z])');
  function blocked(text) {
    if (typeof text !== 'string') return true;
    // Normalize full-width letters and decomposed Hangul, then restore standalone initials.
    const normalized = text.normalize('NFKC').toLowerCase()
      .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F\uFEFF]/g, '')
      .replace(/[\u1100-\u1112]/g, c => 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'[c.charCodeAt(0)-0x1100])
      .replace(/[\u1121\u11b9]/g, 'ㅄ');
    // Exempt common benign compounds, not the rest of a message containing one.
    return matcher.test(normalized.replace(/시발(?:점|역|차)/g, '')) || english.test(normalized);
  }
  window.MessageModeration = { blocked, pattern,
    notice: '욕설이나 공격적인 표현이 포함되어 있습니다. 다른 말로 바꿔주세요.' };
})();
