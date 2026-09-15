(() => {
  const gap = '[^가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z]*';
  const spaced = word => Array.from(word).join(gap);
  const words = ['씨발','씨빨','시빨','씨바','씹새','개새끼','개새키','개색기','병신','븅신','좆','존나','좃나','좆까','꺼져','닥쳐'];
  const initials = ['ㅅㅂ','ㅆㅂ','ㅂㅅ','ㅄ','ㅈㄹ','ㅈㄴ','ㄲㅈ','ㄷㅊ'];
  const pattern = [
    'ㅈ' + gap + '[같가까]',
    ...words.map(spaced),
    spaced('시발') + '([^점]|$)',
    ...initials.map(word => '(^|[^ㄱ-ㅎㅏ-ㅣ])' + spaced(word) + '($|[^ㄱ-ㅎㅏ-ㅣ])'),
    '(^|[^a-z])f' + gap + 'u' + gap + 'c' + gap + 'k(?:ing|er|ers)?($|[^a-z])',
    '(^|[^a-z])' + spaced('shit') + '($|[^a-z])',
    '(^|[^a-z])' + spaced('bitch') + '($|[^a-z])'
  ].join('|');
  const matcher = new RegExp(pattern, 'i');
  function blocked(text) {
    if (typeof text !== 'string') return true;
    // NFC composes Korean syllables; keep compatibility consonants for initial slang.
    const normalized = text.normalize('NFC').replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, '');
    return matcher.test(normalized);
  }
  window.MessageModeration = { blocked, pattern,
    notice: '욕설이나 공격적인 표현이 포함되어 있습니다. 다른 말로 바꿔주세요.' };
})();
