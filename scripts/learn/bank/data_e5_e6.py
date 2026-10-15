# E5 & E6 Data Generators (10 skills total)
# E5: e.e5.gram, e.e5.comp, e.e5.future, e.e5.transform, e.e5.read
# E6: e.e6.tense, e.e6.modal, e.e6.vocab, e.e6.clause, e.e6.read

def get_e5_e6_item(skill_id, i):
    if skill_id == "e.e5.gram":
        items = [
            ("Choose the correct verb form: 'Every student in the class ____ a dictionary.'", "has", ["have", "having", "are having"]),
            ("Choose the correct verb form: 'Each of the players ____ a uniform.'", "wears", ["wear", "wearing", "are wear"]),
            ("Choose the correct verb form: 'Both Sarah and her brother ____ the piano.'", "play", ["plays", "playing", "is play"]),
            ("Choose the correct verb form: 'The dogs in the backyard ____ loudly at strangers.'", "bark", ["barks", "barking", "is bark"]),
            ("Choose the correct verb form: 'Neither of the answers ____ correct.'", "is", ["are", "were", "being"]),
            ("Choose the correct verb form: 'One of my best friends ____ in Canada.'", "lives", ["live", "living", "are live"]),
            ("Choose the correct verb form: 'The teacher and the students ____ in the auditorium.'", "are", ["is", "was", "be"]),
            ("Choose the correct verb form: 'Everyone in our family ____ eating dinner together.'", "enjoys", ["enjoy", "enjoying", "are enjoy"]),
            ("Choose the correct verb form: 'The water in these bottles ____ cold and clean.'", "is", ["are", "were", "be"]),
            ("Choose the correct verb form: 'Some of the cake ____ still on the plate.'", "is", ["are", "were", "have"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Identify the true grammatical subject of the sentence, paying attention to singular vs. plural agreement.",
            "Words like 'every', 'each', and 'everyone' take singular verbs, while compound subjects with 'and' take plural verbs.",
            f"'{ans}' correctly agrees in number with the subject of the sentence."
        )

    elif skill_id == "e.e5.comp":
        items = [
            ("Choose the correct comparative: 'A cheetah runs ____ than a horse.'", "faster", ["fastest", "more fast", "fast"]),
            ("Choose the correct comparative: 'This puzzle is ____ than the previous one.'", "more difficult", ["difficulter", "most difficult", "difficult"]),
            ("Choose the correct superlative: 'Mount Everest is the ____ mountain in the world.'", "highest", ["higher", "most high", "high"]),
            ("Choose the correct superlative: 'The blue whale is the ____ animal on Earth.'", "largest", ["larger", "most large", "large"]),
            ("Choose the correct irregular comparative: 'Today's weather is ____ than yesterday's.'", "better", ["gooder", "more good", "best"]),
            ("Choose the correct irregular superlative: 'That was the ____ movie I have ever seen.'", "worst", ["baddest", "worse", "most bad"]),
            ("Choose the correct comparative: 'My older brother is ____ than me.'", "taller", ["tallest", "more tall", "tall"]),
            ("Choose the correct comparative: 'An airplane travels ____ than a train.'", "faster", ["fastest", "fastly", "more fast"]),
            ("Choose the correct superlative: 'Jupiter is the ____ planet in our solar system.'", "biggest", ["bigger", "most big", "big"]),
            ("Choose the correct comparative: 'Health is ____ important than wealth.'", "more", ["much", "most", "many"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Comparatives compare two items (using -er or more ... than); superlatives compare three or more (using the -est or the most).",
            "Short adjectives usually add -er/-est, longer adjectives use more/most, and remember irregular forms like good/better/best.",
            f"'{ans}' correctly represents the degree of comparison."
        )

    elif skill_id == "e.e5.future":
        items = [
            ("Choose the correct future expression: 'Look at those dark clouds! It is ____ rain.'", "going to", ["will", "goes to", "gone to"]),
            ("Choose the correct future form: 'Don't worry, I ____ help you with your project.'", "will", ["did", "was", "am"]),
            ("Choose the correct verb form: 'She is going to ____ her grandparents this weekend.'", "visit", ["visits", "visited", "visiting"]),
            ("Choose the correct future form: 'Tomorrow, we ____ have our school sports day.'", "will", ["did", "were", "are"]),
            ("Choose the correct future question: 'What are you ____ to do this summer vacation?'", "going", ["will", "went", "go"]),
            ("Choose the correct future form: 'They are going to ____ a new community center next month.'", "build", ["built", "building", "builds"]),
            ("Choose the correct spontaneous decision: 'The phone is ringing. I ____ answer it.'", "will", ["am going", "did", "was"]),
            ("Choose the correct plan expression: 'We are ____ to travel to Jeju Island next Friday.'", "going", ["will", "planning", "went"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Use 'will' for spontaneous decisions or general predictions, and 'be going to' for planned actions or evident predictions.",
            "Both 'will' and 'be going to' are followed by the base form of the main verb.",
            f"'{ans}' correctly expresses the future temporal meaning."
        )

    elif skill_id == "e.e5.transform":
        items = [
            ("Transform into a question: 'He can play the violin well.'", "Can he play the violin well?", ["Does he can play the violin well?", "Is he can play the violin well?", "Can he plays the violin well?"]),
            ("Transform into a negative sentence: 'They went to the science museum yesterday.'", "They did not go to the science museum yesterday.", ["They not went to the science museum yesterday.", "They did not went to the science museum yesterday.", "They were not go to the science museum yesterday."]),
            ("Transform into a question: 'She likes reading history books.'", "Does she like reading history books?", ["Do she like reading history books?", "Is she like reading history books?", "Likes she reading history books?"]),
            ("Transform into a negative sentence: 'He has a pet hamster.'", "He does not have a pet hamster.", ["He has not a pet hamster.", "He does not has a pet hamster.", "He is not have a pet hamster."]),
            ("Transform into a question: 'They were at home last night.'", "Were they at home last night?", ["Did they be at home last night?", "Are they at home last night?", "Were they at home last night?"]),
            ("Transform into a negative sentence: 'She was tired after the long hike.'", "She was not tired after the long hike.", ["She did not tired after the long hike.", "She not was tired after the long hike.", "She were not tired after the long hike."]),
            ("Transform into an affirmative sentence: 'Did he finish his homework?'", "He finished his homework.", ["He finish his homework.", "He did finish his homework.", "He was finished his homework."]),
            ("Transform into a question: 'You have finished your lunch.'", "Have you finished your lunch?", ["Do you have finished your lunch?", "Did you finished your lunch?", "Are you finished your lunch?"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Pay attention to whether the sentence contains a be-verb, auxiliary/modal verb, or general action verb.",
            "General verbs use do/does/did for questions and negatives, followed by the base verb form.",
            f"'{ans}' is the grammatically accurate sentence transformation."
        )

    elif skill_id == "e.e5.read":
        items = [
            ("Read: 'The printing press was invented in the 15th century. It allowed books to be produced quickly and affordably, helping people around the world share knowledge.' What did the printing press help people do?", "Share knowledge around the world", ["Travel to distant planets", "Cook food faster", "Build taller skyscrapers"]),
            ("Read: 'Solar panels turn sunlight into clean electrical energy. Because the sun shines naturally, solar energy does not create air pollution.' Why is solar energy considered clean?", "It does not create air pollution", ["It is very noisy", "It works only at night", "It uses coal and gasoline"]),
            ("Read: 'In autumn, trees in temperate forests prepare for winter. Their green leaves change to yellow, orange, and red before falling to the ground.' What happens to the leaves in autumn?", "They change color and fall", ["They turn bright green", "They grow much larger", "They produce flowers"]),
            ("Read: 'The ancient Olympic Games began in Greece over two thousand years ago. Athletes competed in running, wrestling, and chariot racing to honor Zeus.' Where did the ancient Olympics begin?", "In Greece", ["In Egypt", "In Italy", "In Japan"]),
            ("Read: 'Recycling helps reduce garbage in landfills and saves natural resources. By recycling paper, we can protect forests from being cut down.' How does recycling paper help nature?", "It protects forests from being cut down", ["It creates more plastic waste", "It makes trees grow faster", "It uses more energy"]),
            ("Read: 'Chameleons have specialized skin cells that allow them to change color. They use this ability to hide from predators and communicate with other chameleons.' Why do chameleons change color?", "To hide from predators and communicate", ["To fly through the air", "To stay underwater", "To sleep more deeply"]),
            ("Read: 'Bicycles are a popular form of eco-friendly transportation. Riding a bicycle improves physical health and produces zero exhaust fumes.' What is one benefit of riding a bicycle?", "It produces zero exhaust fumes", ["It uses a lot of gasoline", "It is very loud", "It requires an airplane runway"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Read the informational passage carefully to identify the core cause, effect, or factual detail.",
            "Confirm which option directly matches the evidence provided in the text.",
            f"According to the reading passage, '{ans}' is the correct statement."
        )

    # --- E6 SKILLS ---
    elif skill_id == "e.e6.tense":
        items = [
            ("Choose the correct verb form for duration: 'They ____ in Seoul for three years.'", "have lived", ["lived", "are living", "has lived"]),
            ("Choose the correct verb form: 'We ____ English for three years at school.'", "have studied", ["has studied", "are studying", "studies"]),
            ("Choose the correct verb form for continuing state: 'She ____ in Busan since 2021.'", "has lived", ["have lived", "lived", "is living"]),
            ("Choose the correct verb form for past experience: 'I ____ Jeju Island three times.'", "have visited", ["has visited", "visit", "visiting"]),
            ("Choose the correct verb form for completion: 'He ____ his homework already.'", "has finished", ["have finished", "finishing", "finished"]),
            ("Choose the correct verb form for duration: 'My uncle ____ at this hospital for ten years.'", "has worked", ["have worked", "is working", "works"]),
            ("Choose the correct verb form: 'How long ____ you known your best friend?'", "have", ["has", "did", "are"]),
            ("Choose the correct verb form for experience: '____ you ever seen a shooting star?'", "Have", ["Did", "Has", "Do"]),
            ("Choose the correct verb form: 'She has not ____ her lunch yet.'", "eaten", ["eat", "ate", "eating"]),
            ("Choose the correct verb form: 'The train has already ____ the station.'", "left", ["leave", "leaves", "leaving"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Present perfect connects past actions to the present using 'have/has + past participle'.",
            "Use 'have' with I/you/we/they and 'has' with he/she/it, checking duration signals like 'for' or 'since'.",
            f"'{ans}' correctly forms the present perfect tense in this sentence."
        )

    elif skill_id == "e.e6.modal":
        items = [
            ("Choose the modal verb expressing strong necessity or a strict rule: 'Drivers ____ stop at red traffic lights.'", "must", ["might", "may", "could"]),
            ("Choose the modal verb offering helpful advice: 'You ____ drink plenty of water on hot summer days.'", "should", ["must not", "cannot", "might not"]),
            ("Choose the modal verb expressing polite permission: '____ I borrow your pencil for a moment?'", "May", ["Must", "Should", "Would"]),
            ("Choose the modal verb expressing physical ability: 'Penguins cannot fly, but they ____ swim remarkably well.'", "can", ["must", "should", "may"]),
            ("Choose the modal verb expressing lack of necessity: 'Tomorrow is Sunday, so we ____ get up early.'", "do not have to", ["must not", "cannot", "should not"]),
            ("Choose the modal verb expressing strict prohibition: 'Visitors ____ feed the zoo animals.'", "must not", ["do not have to", "might", "can"]),
            ("Choose the modal verb expressing possibility: 'Take an umbrella; it ____ rain later this afternoon.'", "might", ["must", "should", "shall"]),
            ("Choose the modal verb expressing past ability: 'When he was six, he ____ already ride a bicycle.'", "could", ["can", "may", "must"]),
            ("Choose the modal verb giving medical advice: 'You have a bad fever; you ____ see a doctor today.'", "should", ["might not", "cannot", "may not"]),
            ("Choose the modal verb expressing obligation: 'Students ____ wear helmets when riding bicycles.'", "must", ["might", "may", "could"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Modal verbs convey different shades of meaning: obligation (must/have to), advice (should), ability (can/could), and permission (may/can).",
            "Identify the communicative purpose (strict rule, advice, permission, or ability) required by the context.",
            f"'{ans}' is the modal verb that accurately conveys the required degree of necessity or modality."
        )

    elif skill_id == "e.e6.vocab":
        items = [
            ("Which word means 'to protect the natural environment from harm or waste'?", "conserve", ["destroy", "pollute", "neglect"]),
            ("Which word means 'a person who travels into space in a spacecraft'?", "astronaut", ["passenger", "pilot", "tourist"]),
            ("Which word means 'materials like plastic and paper that can be processed and used again'?", "recyclable", ["disposable", "dangerous", "poisonous"]),
            ("Which word means 'the natural home or environment of an animal or plant'?", "habitat", ["factory", "laboratory", "station"]),
            ("Which word means 'to exchange information, news, or feelings with someone'?", "communicate", ["disagree", "forget", "hesitate"]),
            ("Which word means 'having a great effect and value; very meaningful'?", "significant", ["pointless", "useless", "accidental"]),
            ("Which word means 'energy produced from renewable natural resources like the sun and wind'?", "renewable", ["exhaustible", "toxic", "limited"]),
            ("Which word means 'a formal agreement or promise between two people or groups'?", "promise", ["argument", "mistake", "quarrel"]),
            ("Which word means 'to make something better in quality or condition'?", "improve", ["damage", "weaken", "ruin"]),
            ("Which word means 'to explore or search carefully to discover something new'?", "investigate", ["ignore", "avoid", "abandon"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Analyze the contextual definition to identify the precise academic or everyday vocabulary word.",
            "Eliminate choices with opposite meanings or unrelated semantic fields.",
            f"'{ans}' matches the definition given in the prompt."
        )

    elif skill_id == "e.e6.clause":
        items = [
            ("Choose the correct coordinating conjunction: 'She was very tired, ____ she went to bed early.'", "so", ["because", "although", "unless"]),
            ("Choose the correct subordinating conjunction: 'We stayed indoors ____ it was raining heavily outside.'", "because", ["so", "but", "or"]),
            ("Choose the correct conjunction of contrast: '____ it was cold outside, they went for a walk.'", "Although", ["Because", "Since", "So"]),
            ("Choose the correct relative pronoun: 'I met the student ____ won first prize in the speech contest.'", "who", ["which", "where", "when"]),
            ("Choose the correct relative pronoun: 'This is the interesting novel ____ was written by J.K. Rowling.'", "which", ["who", "where", "when"]),
            ("Choose the correct relative adverb: 'I still remember the wonderful park ____ we met for the first time.'", "where", ["who", "which", "whose"]),
            ("Choose the correct relative adverb: 'Do you remember the day ____ we first joined this school?'", "when", ["where", "which", "who"]),
            ("Choose the correct conjunction of condition: 'You will stay healthy ____ you exercise regularly.'", "if", ["although", "unless", "so"]),
            ("Choose the correct conjunction: 'He studied hard, ____ he passed the entrance exam with high scores.'", "so", ["because", "but", "although"]),
            ("Choose the correct relative pronoun: 'I have a friendly neighbor ____ owns three playful dogs.'", "who", ["which", "where", "what"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Identify the logical relationship between clauses (cause, result, contrast, or relative modification).",
            "Use 'who' for person antecedents, 'which' for things, 'where' for place clauses, and 'so'/'because' for logical reasoning.",
            f"'{ans}' correctly links the clauses with proper syntactic and semantic coherence."
        )

    elif skill_id == "e.e6.read":
        items = [
            ("Read: 'Tropical rainforests produce large amounts of oxygen and absorb carbon dioxide. Because they support millions of plant and animal species, they are often called the lungs of our planet.' Why are rainforests called the lungs of our planet?", "They produce oxygen and absorb carbon dioxide", ["They are cold and snowy", "They have very few animals", "They are man-made parks"]),
            ("Read: 'Electric vehicles produce zero tailpipe emissions and run quietly. As battery technology advances, these cars can travel longer distances on a single charge.' What is one major advantage of electric vehicles mentioned in the text?", "They produce zero tailpipe emissions", ["They use a lot of diesel fuel", "They make loud engine noises", "They cannot travel long distances"]),
            ("Read: 'Ancient Egyptian builders constructed the pyramids as monumental tombs for their pharaohs. Thousands of workers organized blocks of stone with remarkable precision.' What was the primary purpose of the Egyptian pyramids according to the passage?", "As monumental tombs for pharaohs", ["As market shopping centers", "As school classrooms", "As defensive naval forts"]),
            ("Read: 'The Great Barrier Reef off the coast of Australia is the world's largest coral reef system. It provides vital shelter to thousands of diverse marine species.' Where is the Great Barrier Reef located?", "Off the coast of Australia", ["In the Mediterranean Sea", "In the Atlantic Arctic", "Near Antarctica"]),
            ("Read: 'Volcanoes form when molten magma from beneath the Earth's crust erupts through the surface. Over millions of years, cooling lava builds mountains and creates nutrient-rich soil.' How does cooling lava help the environment over time?", "It creates nutrient-rich soil", ["It causes permanent darkness", "It destroys all atmosphere", "It prevents plants from growing"]),
            ("Read: 'Space telescopes orbit high above Earth's atmosphere, allowing astronomers to capture crystal-clear images of distant galaxies without atmospheric distortion.' Why do astronomers place telescopes in space?", "To avoid atmospheric distortion and get clear images", ["Because it is warmer in space", "To build space hotels", "Because telescopes cannot work on land"]),
            ("Read: 'Water filtration systems remove harmful bacteria and sediments from river water, providing safe drinking water for growing cities.' What do water filtration systems remove?", "Harmful bacteria and sediments", ["Useful minerals only", "Fresh oxygen", "Clean ice"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Read the expository text to identify the main explanation, causal reason, or key factual evidence.",
            "Match the question directly with the supporting clause in the passage.",
            f"Based on the reading text, '{ans}' is the correct answer."
        )

    return ("Default prompt", "Default answer", ["d1", "d2", "d3"], "Hint 1", "Hint 2", "Exp")
