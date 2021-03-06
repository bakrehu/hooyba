const { dictionary_en: dictionary, compare_words, dupl_converter, ipa_converter } = require('../src/dictionary');
const parser = require('../src/parser');

const ignored = [ '_____','______' ];

const words_sorted = Object.keys(dictionary).filter((word) => !ignored.includes(word)).sort(compare_words);

words_sorted.forEach((word) => (dictionary[word].without_spaces = word.replaceAll(' ', '').toLowerCase()));

export function count_word_types() {
	let roots = 0;
	let particles = 0;
	let prefixes = 0;
	let phrases = 0;

	words_sorted.forEach((w) => {
		if (dictionary[w].type == 'phrase') phrases++;
		else if (dictionary[w].type == 'particle') particles++;
		else if (dictionary[w].type == 'prefix') prefixes++;
		else roots++;
	});

	return { roots, prefixes, particles, phrases };
}

export function count_letters() {
	let letters={'total':0}

	words_sorted.forEach((w) => {
		w=w.replaceAll("ṕ","P").replaceAll("t́","T").replaceAll("ḱ","K").replaceAll("b́","B").replaceAll("d́","D").replaceAll("ǵ","G").replaceAll("ś","S").replaceAll("ŕ","R");
		for (var i = 0; i < w.length; i++) {
			if(" _áeıouvy".indexOf(w.charAt(i)) == -1){
				if (!letters.hasOwnProperty(w.charAt(i))){
					letters[w.charAt(i)]=0
				}
				letters[w.charAt(i)]++;
				letters['total']++;
			}
			//console.log(w.charAt(i));
		}
	});
	for(var letter in letters){
		console.log(letter, Math.round(letters[letter]/letters['total']*1000)/10)
	}
	return letters;
}

function html_word_entry(word, entry) {
	var output = `<div class="dictionary-entry well well-small"><h3>`;
	if (entry.type == 'phrase') {
		//console.log(parser.segmenter(word))
		Array.from(parser.segmenter(word)).forEach((part) => {
			if (part.includes('_')) {
				output += `${part} `;
			} else {
				output += `<a href="#" class="dictionary-word-link">${part}</a> `;
			}
		});

		output += ': ';
	} else {
		output += `${word}: `;
	}

	output += `<small>`+ipa_converter(`${word}`)+`</small> `;

	output += `<span class="btn btn-mini btn-inverse dictionary-family">${entry.type}</span> `;

	if (entry.tags != undefined) {
		entry.tags.forEach((e) => {
			output += `<span class="btn btn-mini btn-info dictionary-tag">${e}</span> `;
		});
	}
	
	output += `</h3>`;

	output += `<div class="Dupl">`
	
	if (entry.dupl == undefined) {
		output += dupl_converter(`${word}`)
	}else{
		output += dupl_converter(`${entry.dupl}`)
		
	}
	output += `</div>`;
	
	let paragraphs="";
	if (entry.longV != undefined) {
		output += `<b>verb</b><small> - ${entry.shortV}</small> `;
		paragraphs = entry.longV.split(/(\r\n|\r|\n){2,}/);
		paragraphs.forEach((p) => {
			p = escapeHTML(p);
			p = p.replace(/\{([a-zA-Zȷı ́]+)\}/gu, (match, p1) => {
				let out = '<em>';
				let list = parser.segmenter(p1.toLowerCase().replaceAll("´","́").replaceAll('i', 'ı').replaceAll('j', 'ȷ'));
				//let list = p1.split(' ');
				list.forEach((word) => {
					if (word.includes('_')) {
						out += `${p1} `;
					} else {
						out += `<a href="#" class="dictionary-word-link">${p1}</a> `;
					}
				});
				out = out.slice(0, -1); 
				out += '</em>';
	
				return out;
			});

			output += `<p>${p}</p>`;
		});
	}
	
	if (entry.longN != undefined) {
		output += `<b>noun</b><small> - ${entry.shortN}</small> `;
		paragraphs = entry.longN.split(/(\r\n|\r|\n){2,}/);
		paragraphs.forEach((p) => {
			p = escapeHTML(p);
			p = p.replace(/\{([a-zA-Zȷı ́]+)\}/gu, (match, p1) => {
				let out = '<em>';
				let list = parser.segmenter(p1.toLowerCase().replaceAll("´","́").replaceAll('i', 'ı').replaceAll('j', 'ȷ'));
				//let list = p1.split(' ');
				list.forEach((word) => {
					if (word.includes('_')) {
						out += `${p1} `;
					} else {
						out += `<a href="#" class="dictionary-word-link">${p1}</a> `;
					}
				});
				out = out.slice(0, -1); 
				out += '</em>';

				return out;
			});
	
			output += `<p>${p}</p>`;
		});
	}
	
	output += `</div>`;
	return output;
}

function escapeHTML(str) {
	var p = document.createElement('p');
	p.appendChild(document.createTextNode(str));
	return p.innerHTML;
}

export function html_dictionary(filters) {
	var output = '';

	Object.keys(words_sorted).forEach((index) => {
		var word = words_sorted[index];

		let exact_match = false;

		for (var filter in filters) {
			filter = parser.toneMarking(filters[filter].toLowerCase());
			if (filter.startsWith('#')) {
				filter = filter.slice(1);

				if (dictionary[word].tags == undefined || !dictionary[word].tags.includes(filter)) {
					return;
				}
			} else if (filter.startsWith('@')) {
				if (dictionary[word].type.toUpperCase() != filter.slice(1).toUpperCase()) {
					return;
				}
			} else {
				if (word == filter) {
					exact_match = true;
				}

				if (
					!(
						word.includes(filter) ||
						dictionary[word].without_spaces.includes(filter) ||
						parser.toneMarking(dictionary[word].shortN.toLowerCase()).includes(filter) ||
						parser.toneMarking(dictionary[word].longN.toLowerCase()).includes(filter) ||
						parser.toneMarking(dictionary[word].shortV.toLowerCase()).includes(filter) ||
						parser.toneMarking(dictionary[word].longV.toLowerCase()).includes(filter)
					)
				) {
					return;
				}
			}
		}

		// Cache html output.
		if (dictionary[word].html_output == undefined) {
			dictionary[word].html_output = html_word_entry(word, dictionary[word]);
		}

		if (exact_match) {
			// Exact match => first entry
			output = dictionary[word].html_output + output;
		} else {
			output += dictionary[word].html_output;
		}
	});

	return output;
}
