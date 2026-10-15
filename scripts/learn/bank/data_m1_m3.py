# M1..M3 Data Generators (15 skills total)
# M1: e.vocab, e.be, e.pres, e.plural, e.order
# M2: e.m2.perf, e.m2.pass, e.m2.inf, e.m2.comp, e.m2.read
# M3: e.m3.rel, e.m3.cond, e.m3.ques, e.m3.part, e.m3.read

def get_m1_m3_item(skill_id, i):
    # --- M1 SKILLS ---
    if skill_id == "e.vocab":
        items = [
            ("Which word means 'a strong desire to achieve or succeed in something'?", "ambition", ["confusion", "hesitation", "accident"]),
            ("Which word means 'to provide someone with the courage or confidence to do something'?", "encourage", ["discourage", "punish", "refuse"]),
            ("Which word means 'a person who shows visitors around a place of interest'?", "guide", ["tourist", "passenger", "stranger"]),
            ("Which word means 'the science or practice of farming and cultivating soil'?", "agriculture", ["astronomy", "architecture", "aviation"]),
            ("Which word means 'to take part in an activity alongside others'?", "participate", ["hesitate", "disappear", "isolate"]),
            ("Which word means 'a difficult task that tests a person's ability or determination'?", "challenge", ["comfort", "habit", "routine"]),
            ("Which word means 'to produce a copy of something; to make something happen again'?", "reproduce", ["destroy", "forget", "interrupt"]),
            ("Which word means 'lasting for only a limited period of time; not permanent'?", "temporary", ["eternal", "infinite", "ancient"]),
            ("Which word means 'having a natural ability or talent for something'?", "gifted", ["clumsy", "helpless", "awkward"]),
            ("Which word means 'to achieve or complete something successfully'?", "accomplish", ["abandon", "ignore", "neglect"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Carefully analyze the contextual definition to identify the target vocabulary word.",
            "Eliminate choices that mean the exact opposite or represent unrelated concepts.",
            f"'{ans}' accurately matches the definition provided."
        )

    elif skill_id == "e.be":
        items = [
            ("Choose the correct be-verb: 'There ____ thirty students in our classroom today.'", "are", ["is", "was", "be"]),
            ("Choose the correct be-verb: 'There ____ a lot of traffic on the highway this morning.'", "was", ["were", "are", "be"]),
            ("Choose the correct be-verb: 'Both of my parents ____ teachers at the local school.'", "are", ["is", "was", "being"]),
            ("Choose the correct be-verb: 'Physics ____ his favorite academic subject in middle school.'", "is", ["are", "were", "be"]),
            ("Choose the correct be-verb: 'The news about the championship ____ exciting to hear.'", "was", ["were", "are", "be"]),
            ("Choose the correct be-verb: 'Neither the teacher nor the students ____ aware of the schedule change.'", "were", ["was", "is", "be"]),
            ("Choose the correct be-verb: 'Ten kilometers ____ a long distance to walk in an hour.'", "is", ["are", "were", "be"]),
            ("Choose the correct be-verb: 'Where ____ you at five o'clock yesterday afternoon?'", "were", ["was", "are", "is"]),
            ("Choose the correct be-verb: 'There ____ an exciting book and two pens on the table.'", "is", ["are", "were", "be"]),
            ("Choose the correct be-verb: 'Neither of the boys ____ absent yesterday.'", "was", ["were", "are", "be"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Determine the true grammatical number of the subject and the tense of the sentence.",
            "Remember that subjects like distance/time amounts, 'news', and 'physics' take singular verbs, while plural compound subjects take plural verbs.",
            f"'{ans}' correctly agrees with the subject in person, number, and tense."
        )

    elif skill_id == "e.pres":
        items = [
            ("Choose the correct tense: 'Listen! Someone ____ the piano in the music room right now.'", "is playing", ["plays", "played", "was playing"]),
            ("Choose the correct tense: 'The Earth ____ around the sun as an established scientific fact.'", "revolves", ["is revolving", "revolved", "revolve"]),
            ("Choose the correct tense: 'Water ____ at 100 degrees Celsius under standard atmospheric pressure.'", "boils", ["is boiling", "boiled", "boil"]),
            ("Choose the correct verb form: 'I ____ what you mean by that explanation.'", "understand", ["am understanding", "understands", "have understood"]),
            ("Choose the correct tense: 'Look outside! It ____ heavily at the moment.'", "is raining", ["rains", "rained", "rain"]),
            ("Choose the correct verb form: 'My father usually ____ up at six o'clock every morning.'", "wakes", ["is waking", "woke", "wake"]),
            ("Choose the correct stative verb usage: 'This soup ____ delicious and fresh.'", "tastes", ["is tasting", "tasted", "taste"]),
            ("Choose the correct verb form: 'She ____ two foreign languages fluently.'", "speaks", ["is speaking", "spoke", "speak"]),
            ("Choose the correct tense: 'Right now, the scientists ____ an important experiment in the lab.'", "are conducting", ["conduct", "conducted", "conducts"]),
            ("Choose the correct verb form: 'He currently ____ for a major international technology firm.'", "works", ["working", "is work", "work"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Present simple describes habits and general scientific truths, while present continuous describes actions in progress right now.",
            "Stative verbs describing perception, cognition, or state (like understand, taste, know) are rarely used in continuous tenses.",
            f"'{ans}' is the correct aspect and tense for this context."
        )

    elif skill_id == "e.plural":
        items = [
            ("Choose the correct quantifier: 'We do not have ____ water left in our canteens.'", "much", ["many", "few", "a few"]),
            ("Choose the correct quantifier: 'There are ____ historic monuments in this ancient city.'", "many", ["much", "little", "a little"]),
            ("Choose the correct quantifier: 'She has ____ close friends who always support her.'", "a few", ["a little", "much", "little"]),
            ("Choose the correct quantifier: 'I had ____ time to finish the exam, so I could not answer the final question.'", "little", ["few", "a few", "many"]),
            ("Choose the correct irregular plural noun: 'Several ____ were grazing peacefully in the valley.'", "sheep", ["sheeps", "sheepes", "shoop"]),
            ("Choose the correct irregular plural noun: 'All the ____ in the community took part in the festival.'", "children", ["childs", "childrens", "childes"]),
            ("Choose the correct irregular plural noun: 'Dentists recommend brushing your ____ twice daily.'", "teeth", ["tooths", "teethes", "toothes"]),
            ("Choose the correct noun form: 'The police found valuable ____ regarding the mystery.'", "information", ["informations", "informationes", "inform"]),
            ("Choose the correct quantifier: 'He gave me ____ useful advice on choosing a career.'", "some", ["many", "few", "a few"]),
            ("Choose the correct irregular plural noun: 'Several wild ____ were seen near the lake.'", "geese", ["gooses", "geeses", "goos"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Distinguish between countable nouns (many, a few, few) and uncountable nouns (much, a little, little).",
            "Be mindful of uncountable nouns like 'information' and 'advice' as well as irregular plurals like sheep, teeth, and children.",
            f"'{ans}' correctly follows rules of noun countability and quantification."
        )

    elif skill_id == "e.order":
        items = [
            ("Choose the natural word order with an indirect object: 'My uncle gave ____.'", "me a wonderful birthday present", ["a wonderful birthday present me", "to me a wonderful birthday present", "for me a wonderful birthday present"]),
            ("Choose the correct dative shift preposition: 'She sent a postcard ____ her friend in London.'", "to", ["for", "at", "with"]),
            ("Choose the correct dative shift preposition: 'Mom made a delicious chocolate cake ____ my birthday.'", "for", ["to", "at", "with"]),
            ("Choose the correctly structured sentence: 'He showed his stamp collection to his classmates.'", "He showed his classmates his stamp collection.", ["He showed his stamp collection his classmates.", "He showed to his classmates his stamp collection.", "He showed his stamp collection for his classmates."]),
            ("Choose the correct adjective order: 'She bought a ____ jacket.'", "beautiful small black leather", ["leather black small beautiful", "black beautiful leather small", "small leather beautiful black"]),
            ("Choose the correct adverb placement: 'He ____ arrives on time for his morning classes.'", "always", ["on time always", "arrives always", "is always arrive"]),
            ("Choose the natural sentence structure: 'Can you lend me your dictionary?'", "Can you lend your dictionary to me?", ["Can you lend to me your dictionary?", "Can you lend me to your dictionary?", "Can you lend your dictionary for me?"]),
            ("Choose the correct word order: 'They bought their parents a beautiful souvenir.'", "They bought a beautiful souvenir for their parents.", ["They bought a beautiful souvenir to their parents.", "They bought to their parents a beautiful souvenir.", "They bought for their parents a beautiful souvenir."])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Dative verbs can take [indirect object + direct object] or [direct object + preposition (to/for) + indirect object].",
            "Verbs like give/send/show take 'to', while verbs like make/buy/cook take 'for'.",
            f"'{ans}' correctly reflects natural English syntax."
        )

    # --- M2 SKILLS ---
    elif skill_id == "e.m2.perf":
        items = [
            ("Choose the sentence where the present perfect expresses experience: 'I ____ London twice.'", "have visited", ["visit", "am visiting", "visited"]),
            ("Choose the sentence where present perfect expresses a continuing state: 'They ____ each other since elementary school.'", "have known", ["know", "knew", "are knowing"]),
            ("Choose the correct tense with a specific past time adverb: 'She ____ her wallet in the subway yesterday.'", "lost", ["has lost", "have lost", "had lose"]),
            ("Choose the correct verb form for result: 'He ____ to Paris, so he is not in Seoul right now.'", "has gone", ["has been", "went", "goes"]),
            ("Choose the correct verb form for experience: '____ you ever ridden a camel in the desert?'", "Have", ["Did", "Were", "Are"]),
            ("Choose the correct sentence expressing completion: 'I have just finished reading the report.'", "I have just finished reading the report.", ["I have finished just reading the report.", "I just have finished reading the report.", "I have reading just finished the report."]),
            ("Choose the correct tense: 'Last Sunday, we ____ to the amusement park together.'", "went", ["have gone", "had gone", "go"]),
            ("Choose the correct duration preposition: 'He has lived in this quiet neighborhood ____ ten years.'", "for", ["since", "during", "while"]),
            ("Choose the correct time preposition: 'She has played the cello ____ 2018.'", "since", ["for", "during", "from"]),
            ("Choose the correct verb form: 'They have already ____ their tickets for the concert.'", "bought", ["buy", "buying", "buys"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Present perfect connects past and present; specific past time words (yesterday, ago, last year) strictly require simple past.",
            "Use 'since + starting point' and 'for + duration period'. 'Has gone' expresses departure/result, while 'has been' expresses experience.",
            f"'{ans}' correctly follows present perfect grammatical constraints."
        )

    elif skill_id == "e.m2.pass":
        items = [
            ("Choose the natural passive voice sentence: 'The long suspension bridge ____ by experienced engineers in 1995.'", "was built", ["built", "has built", "is building"]),
            ("Choose the natural passive voice sentence: 'The famous historical novel ____ by Charles Dickens.'", "was written", ["wrote", "has written", "is writing"]),
            ("Choose the natural passive voice sentence: 'The delicious strawberry cake ____ by my grandmother yesterday.'", "was baked", ["baked", "has baked", "is baking"]),
            ("Choose the natural passive voice sentence: 'The broken window ____ by the repair technician this morning.'", "was repaired", ["repaired", "has repaired", "is repairing"]),
            ("Choose the natural passive voice sentence: 'The important scientific discovery ____ by researchers in 1928.'", "was made", ["made", "has made", "is making"]),
            ("Choose the correct passive form: 'English is ____ in many countries around the world.'", "spoken", ["speaking", "spoke", "speaks"]),
            ("Choose the correct passive sentence: 'The classroom is ____ by the students every afternoon.'", "cleaned", ["cleaning", "clean", "cleans"]),
            ("Choose the correct passive form: 'The Olympic Games are ____ every four years.'", "held", ["holding", "hold", "holds"]),
            ("Choose the correct passive transformation of 'The chef prepared a special meal':", "A special meal was prepared by the chef.", ["A special meal prepared by the chef.", "A special meal is prepared by the chef.", "A special meal was prepare by the chef."]),
            ("Choose the correct passive sentence: 'The lost puppy ____ by a kind police officer.'", "was found", ["found", "has find", "is finding"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Passive voice is constructed using [be-verb + past participle (+ by agent)].",
            "Make sure the agent logically fits the action (e.g. bridges built by engineers, novels written by authors).",
            f"'{ans}' correctly forms the passive voice with a natural, contextually appropriate agent."
        )

    elif skill_id == "e.m2.inf":
        items = [
            ("Choose the to-infinitive acting as a noun (subject): '____ languages is exciting.'", "To learn", ["Learn", "Learned", "Learning to"]),
            ("Choose the to-infinitive acting as an adverb of purpose: 'He woke up early ____ the sunrise.'", "to see", ["see", "saw", "for seeing"]),
            ("Choose the to-infinitive acting as an adjective: 'I have a lot of homework ____ tonight.'", "to do", ["do", "doing", "done"]),
            ("Choose the to-infinitive expressing emotion's cause: 'I was surprised ____ the sudden news.'", "to hear", ["hear", "heard", "hearing"]),
            ("Choose the correct verb followed by to-infinitive: 'She decided ____ abroad next semester.'", "to study", ["studying", "study", "studied"]),
            ("Choose the correct to-infinitive construction: 'The water is warm enough ____.'", "to swim in", ["swimming in", "to swim", "for swim"]),
            ("Choose the correct verb taking an infinitive object: 'We hope ____ you again soon.'", "to meet", ["meeting", "meet", "met"]),
            ("Choose the to-infinitive phrase of purpose: 'She went to the grocery store ____ some fresh milk.'", "to buy", ["buying", "buy", "bought"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "To-infinitives function as nouns (subject/object), adjectives (modifying nouns), or adverbs (expressing purpose or cause of emotion).",
            "Identify the syntactic role of the to-infinitive in the sentence structure.",
            f"'{ans}' correctly employs the to-infinitive in this syntactic role."
        )

    elif skill_id == "e.m2.comp":
        items = [
            ("Choose the correct comparative pattern: 'The harder you study, the ____ your grades will be.'", "better", ["good", "best", "more good"]),
            ("Choose the correct comparison of equality: 'She runs as ____ as her track coach.'", "fast", ["faster", "fastest", "more fast"]),
            ("Choose the correct comparative intensifier: 'Traveling by plane is ____ faster than taking a ferry.'", "much", ["very", "more", "too"]),
            ("Choose the correct comparative intensifier: 'This mountain trail is ____ steeper than the path we took yesterday.'", "far", ["very", "many", "most"]),
            ("Choose the correct proportional comparison: 'The more you practice speaking, the ____ confident you become.'", "more", ["much", "most", "many"]),
            ("Choose the correct comparison of equality: 'This smartphone is not as ____ as that premium model.'", "expensive", ["more expensive", "most expensive", "expensively"]),
            ("Choose the correct comparative sentence: 'No other ocean in the world is as large as the Pacific Ocean.'", "The Pacific Ocean is larger than any other ocean.", ["The Pacific Ocean is as large than any other ocean.", "The Pacific Ocean is more large than any ocean.", "The Pacific Ocean is the larger ocean."]),
            ("Choose the correct comparative intensifier: 'His explanation made the difficult concept ____ clearer.'", "even", ["very", "quite", "more"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Use 'the + comparative ..., the + comparative ...' for proportional change, and 'as + base form + as' for equality.",
            "Comparatives are intensified by 'much, far, even, still, a lot'—never by 'very'.",
            f"'{ans}' is the correct comparative construction."
        )

    elif skill_id == "e.m2.read":
        items = [
            ("Read: 'Bioluminescence is the production and emission of light by living organisms such as fireflies and deep-sea anglerfish. They use this biochemical light to attract prey, warn predators, and communicate in the dark ocean depths.' What is the primary purpose of bioluminescent light mentioned in the passage?", "To attract prey, warn predators, and communicate", ["To warm cold ocean waters", "To build underwater nests", "To photosynthesize without sunlight"]),
            ("Read: 'Urban rooftop gardens help reduce city temperatures by absorbing heat and providing insulation. They also capture rainwater runoff and create habitats for pollinating insects like bees and butterflies.' How do rooftop gardens help cities during hot weather?", "By absorbing heat and providing insulation", ["By heating city buildings", "By producing smog and dust", "By reflecting all light into space"]),
            ("Read: 'In ancient societies, storytelling was an essential method of passing down moral values, historical events, and ancestral customs before writing systems were invented.' Why was storytelling so vital in ancient societies?", "To pass down moral values and history before writing existed", ["To entertain foreign tourists", "To replace all physical work", "To prevent languages from changing"]),
            ("Read: 'Migratory birds navigate across thousands of miles using Earth's magnetic field, the position of stars, and topographical landmarks. This complex navigation enables them to return to the exact same breeding grounds each spring.' What enables migratory birds to navigate across vast distances?", "Earth's magnetic field, stars, and landmarks", ["Radio signals from cities", "Ocean waves alone", "Wind currents without visual cues"]),
            ("Read: 'Renewable wind energy harnesses kinetic air movements using massive turbine blades to generate electricity without burning coal or natural gas.' What is a key benefit of wind energy described in the text?", "It generates electricity without burning fossil fuels", ["It works only during thunderstorms", "It uses large amounts of coal", "It produces heavy exhaust gases"]),
            ("Read: 'Honeybees perform a specialized 'waggle dance' inside their hive to communicate the precise direction and distance of rich flower patches to other foraging bees.' What information does the waggle dance communicate?", "The precise direction and distance of flowers", ["The arrival of winter storms", "The age of the queen bee", "The size of the hive's honeycomb"]),
            ("Read: 'The discovery of penicillin by Alexander Fleming in 1928 revolutionized modern medicine. It was the first effective antibiotic capable of treating serious bacterial infections that were previously fatal.' Why was penicillin's discovery revolutionary?", "It was the first effective antibiotic for fatal bacterial infections", ["It cured all viral illnesses", "It replaced the need for surgery", "It prevented all physical injuries"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Read the expository paragraph carefully to extract the central message, function, or factual detail.",
            "Identify the phrase in the passage that directly answers the question.",
            f"Based on the reading passage, '{ans}' is the correct answer."
        )

    # --- M3 SKILLS ---
    elif skill_id == "e.m3.rel":
        items = [
            ("Choose the correct relative pronoun: 'The architect ____ designed the modern eco-friendly library won an international prize.'", "who", ["which", "where", "whom"]),
            ("Choose the correct relative pronoun: 'The novel ____ was recommended by our literature teacher became a bestseller.'", "which", ["who", "where", "whom"]),
            ("Choose the correct relative pronoun: 'I met an inspiring scientist ____ research focuses on renewable energy.'", "whose", ["who", "which", "whom"]),
            ("Choose the correct relative adverb: 'This is the university laboratory ____ the vaccine was first developed.'", "where", ["which", "that", "whose"]),
            ("Choose the correct relative adverb: 'I still cherish the memorable day ____ we won the national championship.'", "when", ["where", "which", "who"]),
            ("Choose the correct relative adverb: 'Please explain the primary reason ____ you decided to change your major.'", "why", ["which", "where", "how"]),
            ("Choose the correct relative pronoun in non-restrictive clause: 'My uncle, ____ lives in Seattle, is a software engineer.'", "who", ["that", "which", "whose"]),
            ("Choose the correct relative pronoun in non-restrictive clause: 'She gave me an interesting book, ____ I read in two days.'", "which", ["that", "who", "where"]),
            ("Choose the correct relative pronoun: 'The student ____ the scholarship was awarded to delivered a heartfelt speech.'", "whom", ["which", "whose", "where"]),
            ("Choose the sentence where the relative pronoun can be omitted:", "The movie that we watched last night was thrilling.", ["The actor who starred in the film was famous.", "The director whose movie won the award celebrated.", "The film which won the grand prize was inspiring."])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Select the relative word based on the antecedent (person -> who/whom/whose; thing -> which/whose; place -> where; time -> when).",
            "Remember that object-case relative pronouns can be omitted, and 'that' cannot follow a comma in non-restrictive clauses.",
            f"'{ans}' correctly connects the relative clause to its antecedent."
        )

    elif skill_id == "e.m3.cond":
        items = [
            ("Choose the correct second conditional form: 'If I had enough time, I ____ travel around the world.'", "would", ["will", "can", "am"]),
            ("Choose the correct second conditional form: 'If she knew the answer to the riddle, she ____ tell us.'", "would", ["will", "can", "is"]),
            ("Choose the correct second conditional form: 'If I were you, I ____ accept the internship offer.'", "would", ["will", "can", "am"]),
            ("Choose the correct conditional form: 'If it rains tomorrow, we ____ cancel the outdoor picnic.'", "will", ["would", "could", "were"]),
            ("Choose the correct second conditional verb: 'If he ____ more carefully, he would not make so many mistakes.'", "drove", ["drives", "will drive", "has driven"]),
            ("Choose the correct second conditional verb: 'If we ____ a million dollars, we would build a community shelter.'", "had", ["have", "will have", "have had"]),
            ("Choose the correct second conditional clause: 'If she ____ taller, she could reach the top bookshelf.'", "were", ["is", "was being", "will be"]),
            ("Choose the correct first conditional form: 'If you study consistently, you ____ pass the test.'", "will", ["would", "could", "were to"]),
            ("Choose the correct second conditional main clause: 'If I had wings, I ____ fly across the ocean.'", "could", ["can", "will", "may"]),
            ("Choose the correct second conditional sentence:", "If I knew his phone number, I would call him immediately.", ["If I know his phone number, I would call him immediately.", "If I knew his phone number, I will call him immediately.", "If I would know his phone number, I called him immediately."])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "First conditional (real present/future) uses 'If + present ..., will + base verb'.",
            "Second conditional (hypothetical/unreal present) uses 'If + past (were) ..., would/could/might + base verb'.",
            f"'{ans}' correctly follows conditional grammatical rules."
        )

    elif skill_id == "e.m3.ques":
        items = [
            ("Choose the correct indirect question word order: 'Could you tell me ____?'", "where the nearest subway station is", ["where is the nearest subway station", "where does the nearest subway station be", "where the nearest subway station was"]),
            ("Choose the correct indirect question: 'I wonder ____.'", "what time the concert begins", ["what time does the concert begin", "what time begins the concert", "what time is the concert begin"]),
            ("Choose the correct indirect question: 'Do you know ____?'", "who designed this landmark building", ["who did design this landmark building", "who does design this landmark building", "whom designed this landmark building"]),
            ("Choose the correct question tag: 'She is a talented musician, ____?'", "isn't she", ["is she", "doesn't she", "wasn't she"]),
            ("Choose the correct question tag: 'You have visited Paris before, ____?'", "haven't you", ["have you", "didn't you", "don't you"]),
            ("Choose the correct question tag: 'They will attend the science seminar tomorrow, ____?'", "won't they", ["will they", "don't they", "aren't they"]),
            ("Choose the correct question tag: 'He speaks three languages fluently, ____?'", "doesn't he", ["does he", "isn't he", "hasn't he"]),
            ("Choose the correct indirect question: 'Please tell me ____.'", "how much this jacket costs", ["how much does this jacket cost", "how much costs this jacket", "how much is this jacket cost"]),
            ("Choose the correct indirect question: 'I would like to know ____.'", "why the train was delayed", ["why was the train delayed", "why did the train delay", "why the train delayed was"]),
            ("Choose the correct question tag: 'You didn't see the movie, ____?'", "did you", ["didn't you", "do you", "weren't you"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Indirect questions embedded in a main clause must use declarative word order: [Question word / If / Whether + Subject + Verb].",
            "Question tags reverse the polarity of the statement (positive statement -> negative tag, negative statement -> positive tag).",
            f"'{ans}' correctly observes indirect question or question tag syntax."
        )

    elif skill_id == "e.m3.part":
        items = [
            ("Choose the correct participle: 'The championship match was so ____ that fans stood until the end.'", "exciting", ["excited", "excite", "excitement"]),
            ("Choose the correct participle: 'The exhausted hikers felt thoroughly ____ after climbing the steep mountain.'", "tired", ["tiring", "tire", "tiredness"]),
            ("Choose the correct participle modifying the noun: 'Be careful with the ____ glass on the floor.'", "broken", ["breaking", "break", "broke"]),
            ("Choose the correct participle modifying the noun: 'The ____ sun illuminated the snow-capped peaks.'", "rising", ["risen", "rose", "rise"]),
            ("Choose the correct participle: 'The students were deeply ____ in the lecture on marine biology.'", "interested", ["interesting", "interest", "interests"]),
            ("Choose the correct participial phrase: '____ by the loud noise, the puppy hid under the sofa.'", "Frightened", ["Frightening", "Frighten", "Having frighten"]),
            ("Choose the correct participial phrase: '____ on the bus, she listened to an audio podcast.'", "Sitting", ["Sat", "Seat", "Having sit"]),
            ("Choose the correct participle: 'We heard the unexpected and ____ news this morning.'", "shocking", ["shocked", "shock", "shockingly"]),
            ("Choose the correct participle: 'He fell asleep while ____ a difficult book.'", "reading", ["read", "reads", "reader"]),
            ("Choose the correct participial phrase: '____ all her homework early, she went out to play tennis.'", "Having finished", ["Finished", "Finishing having", "Have finished"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Present participles (-ing) describe causing a feeling or an ongoing active state; past participles (-ed/irregular) describe receiving a feeling or a completed passive state.",
            "In participial clauses, ensure the participle's implicit subject matches the main clause's subject.",
            f"'{ans}' correctly applies participial inflection in this context."
        )

    elif skill_id == "e.m3.read":
        items = [
            ("Read: 'Neuroplasticity refers to the brain's lifelong ability to reorganize itself by forming new neural connections. When people learn a musical instrument or study a foreign language, their brains physically adapt and strengthen relevant pathways.' What enables the brain to adapt throughout life according to the text?", "The ability to form new neural connections", ["Fixed static brain structures", "A decrease in brain volume", "The elimination of all memories"]),
            ("Read: 'Desalination plants remove salts and minerals from seawater to produce fresh potable water. While this process provides crucial water to arid coastal regions, it consumes large amounts of electrical energy and produces concentrated brine.' What is one major challenge of desalination plants mentioned in the text?", "They consume large amounts of electrical energy", ["They cannot produce fresh water", "They work only in freezing climates", "They require zero maintenance"]),
            ("Read: 'Citizen science projects invite members of the general public to collect data on bird migrations and weather patterns. By combining contributions from thousands of volunteers, researchers can analyze ecological trends across continents.' How do citizen science projects assist researchers?", "By gathering large datasets across continents through volunteers", ["By replacing all professional scientists", "By conducting dangerous chemical experiments alone", "By preventing all climate change immediately"]),
            ("Read: 'The Silk Road was an expansive network of Eurasian trade routes that connected East Asia with the Mediterranean. Beyond luxury goods like silk and spices, it facilitated the exchange of scientific ideas, philosophical traditions, and technologies.' What was exchanged along the Silk Road besides physical goods?", "Scientific ideas, philosophies, and technologies", ["Nuclear energy designs", "Modern digital currencies", "Automated manufacturing robotics"]),
            ("Read: 'Microplastics are tiny plastic fragments measuring less than five millimeters. Because they do not biodegrade easily, they accumulate in marine ecosystems, where aquatic organisms ingest them, introducing toxic compounds into the food web.' Why do microplastics pose a serious ecological threat?", "They accumulate in marine ecosystems and enter the food web", ["They dissolve completely in rainwater within hours", "They provide essential nutrition to marine fish", "They sink harmlessly into the earth's core"]),
            ("Read: 'Selective breeding in agriculture has transformed wild ancestors into modern high-yielding crops. Over thousands of years, ancient farmers selected seeds from plants with desirable traits such as drought resistance and larger fruit size.' What traits did ancient farmers select for?", "Desirable traits like drought resistance and larger fruit size", ["Smaller seeds with bitter taste", "Vulnerability to crop diseases", "Plants that grow only in winter darkness"]),
            ("Read: 'Cryptocurrency relies on decentralized blockchain ledgers rather than central bank authorities. Each transaction is verified by networked computers and cryptographically sealed into immutable blocks.' What secures cryptocurrency transactions according to the passage?", "Cryptographically sealed decentralized blockchain ledgers", ["Physical paper certificates stored in bank vaults", "Single government agency approvals", "Unverified verbal promises"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Carefully analyze the informational text to identify the central concept, scientific mechanism, or factual relationship.",
            "Verify which option directly reflects the text's statements without exaggeration or distortion.",
            f"According to the reading passage, '{ans}' is the accurate statement."
        )

    return ("Default prompt", "Default answer", ["d1", "d2", "d3"], "Hint 1", "Hint 2", "Exp")
