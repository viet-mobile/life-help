# H1..H3 Data Generators (15 skills total)
# H1: e.h1.tense, e.h1.clause, e.h1.partc, e.h1.conn, e.h1.main
# H2: e.h2.inv, e.h2.subj, e.h2.wh, e.h2.vocab, e.h2.logic
# H3: e.h3.par, e.h3.tone, e.h3.ins, e.h3.col, e.h3.sum

def get_h1_h3_item(skill_id, i):
    # --- H1 SKILLS ---
    if skill_id == "e.h1.tense":
        items = [
            ("Choose the correct past perfect verb: 'When we arrived at the concert hall, the performance ____ already.'", "had begun", ["began", "has begun", "was beginning"]),
            ("Choose the correct tense for an earlier past event: 'She realized that she ____ her key at the office.'", "had left", ["has left", "leaves", "was leaving"]),
            ("Choose the correct future perfect form: 'By next December, we ____ from this high school.'", "will have graduated", ["will graduate", "graduated", "have graduated"]),
            ("Choose the correct past perfect form: 'He could not buy the ticket because he ____ his wallet earlier.'", "had lost", ["has lost", "lost", "was losing"]),
            ("Choose the correct tense in reported speech: 'She said that she ____ in London for five years before moving here.'", "had lived", ["has lived", "lives", "will live"]),
            ("Choose the correct future perfect verb: 'By the time you return, I ____ reading this textbook.'", "will have finished", ["finish", "finished", "have finished"]),
            ("Choose the correct past perfect form: 'The train ____ before we reached the platform.'", "had departed", ["departs", "has departed", "was departing"]),
            ("Choose the correct tense expressing prior completion: 'They examined the data that the satellite ____ earlier.'", "had transmitted", ["has transmitted", "transmits", "transmitting"]),
            ("Choose the correct future perfect form: 'By 2030, scientists ____ new renewable battery technologies.'", "will have developed", ["developed", "develop", "are developing"]),
            ("Choose the correct past perfect form: 'She told me she ____ that documentary film twice before.'", "had seen", ["has seen", "saw", "sees"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Past perfect (had + p.p.) expresses an event completed prior to another past reference point.",
            "Future perfect (will have + p.p.) expresses an event that will be completed before a specified future time.",
            f"'{ans}' correctly coordinates tense and aspect in this complex temporal structure."
        )

    elif skill_id == "e.h1.clause":
        items = [
            ("Choose the correct noun clause conjunction: '____ she passed the rigorous examination surprised no one.'", "That", ["What", "Which", "Whether"]),
            ("Choose the correct noun clause conjunction: 'The question is ____ the committee will approve the proposed budget.'", "whether", ["that", "what", "which"]),
            ("Choose the correct pronoun introducing a noun clause: '____ he said during the conference inspired many young researchers.'", "What", ["That", "Which", "Where"]),
            ("Choose the correct adverbial clause conjunction of concession: '____ the experiment was challenging, the team persevered.'", "Although", ["Because", "Since", "So"]),
            ("Choose the correct clause connector of condition: 'We cannot enter the laboratory ____ we wear protective safety gear.'", "unless", ["if", "although", "because"]),
            ("Choose the correct noun clause conjunction: 'I am doubtful ____ the weather conditions will improve before tomorrow.'", "whether", ["that", "what", "which"]),
            ("Choose the correct adverbial conjunction: 'Please remain seated ____ the airplane has come to a complete stop.'", "until", ["while", "unless", "since"]),
            ("Choose the correct relative/noun clause pronoun: 'You can choose ____ path aligns best with your academic goals.'", "whichever", ["whatever", "whoever", "however"]),
            ("Choose the correct noun clause conjunction: 'Scientists have confirmed the fact ____ global temperatures are rising.'", "that", ["which", "what", "whether"]),
            ("Choose the correct conjunction of purpose: 'He took detailed notes ____ he would remember the key findings.'", "so that", ["in order to", "because", "although"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Noun clauses function as subjects, objects, or complements, introduced by 'that', 'whether/if', or 'what' (which includes its antecedent).",
            "Adverbial clauses express relations of concession (although), condition (unless), or purpose (so that).",
            f"'{ans}' correctly functions as the syntactic clause connector."
        )

    elif skill_id == "e.h1.partc":
        items = [
            ("Choose the correct participial phrase expressing reason: '____ exhausted after the marathon, she fell asleep immediately.'", "Feeling", ["Felt", "To feel", "Having felt being"]),
            ("Choose the correct passive participial phrase: '____ from a distance, the ancient fortress looked like a natural cliff.'", "Seen", ["Seeing", "Saw", "To see"]),
            ("Choose the correct absolute participial construction: '____ no further questions, the chairperson adjourned the meeting.'", "There being", ["It being", "Being there", "There was"]),
            ("Choose the correct accompanying circumstance: 'She sat on the bench with her arms ____ across her chest.'", "folded", ["folding", "fold", "to fold"]),
            ("Choose the correct participial phrase of concession: '____ all night, he was unable to answer the complex query.'", "Having studied", ["Studied", "Study", "To study"]),
            ("Choose the correct participial phrase: '____ into simple language, the theory became accessible to everyone.'", "Translated", ["Translating", "Translate", "Having translate"]),
            ("Choose the correct accompanying circumstance: 'He listened to the lecture with his eyes ____ tightly.'", "closed", ["closing", "close", "to close"]),
            ("Choose the correct participial phrase: '____ by the sudden flash of lightning, the horse reared back.'", "Startled", ["Startling", "Startle", "To startle"]),
            ("Choose the correct active participial phrase: '____ the final paragraph, the author saved her document.'", "Finishing", ["Finished", "Finish", "To finish"]),
            ("Choose the correct perfect participial phrase: '____ never visited Paris, she relied on a guide map.'", "Having", ["Had", "Have", "Being"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "In participial constructions, check whether the relationship with the main clause subject is active (-ing) or passive (-ed/p.p.).",
            "In 'with + noun + participle', use past participles for passive postures/states (folded, closed) and present participles for active actions.",
            f"'{ans}' correctly forms the participial structure."
        )

    elif skill_id == "e.h1.conn":
        items = [
            ("Choose the discourse marker expressing contrast: 'The initial prototype failed; ____, the engineers learned valuable insights.'", "nevertheless", ["furthermore", "consequently", "similarly"]),
            ("Choose the discourse marker expressing causal result: 'The company reduced operating expenses; ____, quarterly profits rose.'", "consequently", ["however", "nevertheless", "instead"]),
            ("Choose the discourse marker adding reinforcing information: 'Solar power is eco-friendly; ____, its installation costs are falling.'", "furthermore", ["in contrast", "otherwise", "nonetheless"]),
            ("Choose the discourse marker expressing direct contradiction: 'He was not discouraged by the critique; ____, he redoubled his efforts.'", "on the contrary", ["similarly", "therefore", "as a result"]),
            ("Choose the discourse marker expressing condition/alternative: 'You must submit the application today; ____, it will not be evaluated.'", "otherwise", ["furthermore", "likewise", "moreover"]),
            ("Choose the discourse marker expressing analogy: 'Reading exercises the mind; ____, physical training strengthens the body.'", "likewise", ["however", "consequently", "on the other hand"]),
            ("Choose the discourse marker introducing an unexpected contrast: 'The storm was fierce; ____, the coastal lighthouse stood firm.'", "nonetheless", ["hence", "furthermore", "similarly"]),
            ("Choose the discourse marker summarizing points: '____, the research demonstrates a clear link between sleep and memory.'", "In conclusion", ["On the other hand", "For instance", "Otherwise"]),
            ("Choose the discourse marker providing exemplification: 'Many clean energy options exist; ____, geothermal and tidal energy are expanding.'", "for example", ["however", "consequently", "instead"]),
            ("Choose the discourse marker indicating logical deduction: 'He has lived in Germany for twenty years; ____, he speaks German with native fluency.'", "hence", ["nevertheless", "otherwise", "in contrast"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Analyze the logical flow between the preceding and following sentences (contrast, addition, cause-and-effect, or exemplification).",
            "Select the transition word that precisely matches the semantic relationship.",
            f"'{ans}' establishes the correct logical transition between the independent clauses."
        )

    elif skill_id == "e.h1.main":
        items = [
            ("What is the central claim of this passage? 'While rapid technological automation eliminates routine manual jobs, historical precedents show it simultaneously creates higher-order cognitive roles that cannot be anticipated in advance.'", "Automation shifts labor toward unanticipated cognitive roles", ["Automation permanently destroys all employment", "Manual jobs will remain the foundation of modern economies", "Technological innovation should be prohibited by law"]),
            ("What is the main topic of this passage? 'Urban green corridors provide critical passageways for wildlife between fragmented parks, facilitating genetic diversity and migration within expanding metropolitan zones.'", "The ecological importance of urban green corridors", ["The architectural design of highway bridges", "Methods for expanding suburban shopping malls", "The decline of wild bird populations"]),
            ("What is the primary message of this passage? 'Active cognitive retrieval through self-testing strengthens neural memory traces far more effectively than passive re-reading of textbooks.'", "Active testing is superior to passive review for retention", ["Students should never take self-assessment exams", "Re-reading is the undisputed optimal study strategy", "Memory traces cannot be reinforced through practice"]),
            ("What is the author's primary assertion? 'Scientific progress is rarely a steady linear accumulation of facts; rather, it advances through disruptive paradigm shifts that reorganize fundamental assumptions.'", "Science advances through revolutionary paradigm shifts", ["Scientific knowledge never changes once established", "Progress occurs through steady, minor additions only", "Fundamental assumptions should never be questioned"]),
            ("What is the central thesis? 'Renewable energy systems must integrate decentralized battery storage to buffer intermittent wind and solar outputs across fluctuating electrical grids.'", "Decentralized storage is vital for stabilizing renewable grids", ["Fossil fuels are permanently irreplaceable", "Solar panels can operate at full efficiency without sunlight", "Grid fluctuations have no impact on renewable integration"]),
            ("What is the main point? 'Effective leadership in modern multicultural teams requires active empathetic listening rather than unilateral top-down instruction.'", "Empathetic communication is essential in diverse teams", ["Leaders should avoid consulting team members", "Cultural diversity reduces team problem-solving ability", "Top-down command is always the most effective strategy"]),
            ("What is the central focus? 'Biodiversity loss threatens ecosystem resilience, making natural habitats more susceptible to climate shocks and invasive species.'", "Biodiversity loss weakens the resilience of ecosystems", ["Invasive species always improve habitat stability", "Resilient ecosystems do not require diverse species", "Climate shocks affect only agricultural farmland"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Identify the overarching argument or primary thesis that encompasses all supporting details in the passage.",
            "Eliminate choices that are too narrow, too broad, or directly contradict the author's viewpoint.",
            f"'{ans}' accurately encapsulates the central claim of the passage."
        )

    # --- H2 SKILLS ---
    elif skill_id == "e.h2.inv":
        items = [
            ("Choose the correct inversion structure: 'Seldom ____ such a breathtaking performance on a theatrical stage.'", "have I witnessed", ["I have witnessed", "did I witnessed", "I witnessed"]),
            ("Choose the correct inversion structure: 'Not only ____ the international prize, but she also inspired future generations.'", "did she win", ["she won", "she did win", "was she won"]),
            ("Choose the correct negative inversion: 'Hardly ____ home when the torrential rain began.'", "had we arrived", ["we had arrived", "did we arrived", "have we arrived"]),
            ("Choose the correct negative inversion: 'Under no circumstances ____ personal security passwords be shared.'", "should", ["must not", "are", "do"]),
            ("Choose the correct negative inversion: 'Rarely ____ a student demonstrate such profound philosophical insight.'", "does", ["is", "has", "do"]),
            ("Choose the correct conditional inversion without 'if': '____ I known about the conference earlier, I would have registered.'", "Had", ["Should", "Were", "Did"]),
            ("Choose the correct conditional inversion without 'if': '____ he to decline the offer, we would seek another candidate.'", "Were", ["Had", "Should", "Did"]),
            ("Choose the correct directional inversion: 'Through the dense forest ____ a sparkling freshwater stream.'", "flowed", ["did flow", "flowing", "did it flow"]),
            ("Choose the correct negative inversion: 'Scarcely ____ the museum opened its doors before a long line formed.'", "had", ["did", "was", "has"]),
            ("Choose the correct inversion with 'Only': 'Only after completing the rigorous field research ____ the scientist publish her findings.'", "did", ["was", "she did", "that"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Negative adverbs (Seldom, Rarely, Hardly, Not only) placed at the beginning of a clause trigger auxiliary-subject inversion.",
            "In conditional inversion omitting 'if', use 'Had + S + p.p.' for past unreal conditions, or 'Were + S + to-inf' for future hypothetical conditions.",
            f"'{ans}' correctly follows inverted word order rules."
        )

    elif skill_id == "e.h2.subj":
        items = [
            ("Choose the subjunctive mood expressing an unreal present wish: 'I wish I ____ speak several languages fluently.'", "could", ["can", "will", "am able"]),
            ("Choose the subjunctive mood verb: 'The committee demanded that the safety report ____ immediately.'", "be released", ["is released", "was released", "will be released"]),
            ("Choose the subjunctive mood expressing past regret: 'She wishes she ____ the opportunity to study in London last year.'", "had taken", ["took", "takes", "has taken"]),
            ("Choose the subjunctive mood verb: 'The professor recommended that each student ____ a research proposal.'", "submit", ["submits", "submitted", "is submitting"]),
            ("Choose the subjunctive mood expression: 'He talks about quantum mechanics as if he ____ a Nobel laureate in physics.'", "were", ["is", "was being", "has been"]),
            ("Choose the subjunctive mood verb: 'It is essential that every participant ____ present at the briefing.'", "be", ["is", "was", "will be"]),
            ("Choose the subjunctive mood verb: 'The doctor insisted that the patient ____ complete bed rest for a week.'", "take", ["takes", "took", "is taking"]),
            ("Choose the subjunctive mood expression: 'She looked at the antique painting as though she ____ it somewhere before.'", "had seen", ["saw", "sees", "has seen"]),
            ("Choose the subjunctive mood verb: 'It is imperative that the government ____ urgent action on climate mitigation.'", "take", ["takes", "took", "is taking"]),
            ("Choose the subjunctive mood expressing an unreal present state: 'If only he ____ here with us right now!'", "were", ["is", "was being", "will be"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Verbs of demand, recommendation, or requirement (demand, recommend, insist) take 'that + S + (should) + base verb'.",
            "'I wish' and 'as if' take past tense for unreal present situations, and past perfect for unreal past situations.",
            f"'{ans}' correctly applies subjunctive mood conventions."
        )

    elif skill_id == "e.h2.wh":
        items = [
            ("Choose the preposition + relative pronoun: 'This is the foundational theory upon ____ modern quantum mechanics is built.'", "which", ["that", "where", "what"]),
            ("Choose the preposition + relative pronoun: 'She described the challenging conditions under ____ the research was conducted.'", "which", ["that", "where", "what"]),
            ("Choose the compound relative pronoun: '____ completes the advanced coding course will receive an official certification.'", "Whoever", ["Whomever", "Whichever", "Whatever"]),
            ("Choose the preposition + relative pronoun: 'He is the esteemed mentor to ____ I owe my academic success.'", "whom", ["who", "which", "whose"]),
            ("Choose the preposition + relative pronoun: 'We observed the intricate mechanism through ____ the clock functions.'", "which", ["that", "where", "how"]),
            ("Choose the compound relative pronoun: 'You may choose ____ specialization aligns best with your career goals.'", "whichever", ["whatever", "whoever", "however"]),
            ("Choose the preposition + relative pronoun: 'The ancient stone fortress in ____ the monarch resided is now a museum.'", "which", ["that", "where", "what"]),
            ("Choose the compound relative pronoun: '____ happens during the negotiation, we must maintain our professional composure.'", "Whatever", ["Whichever", "Whoever", "Whenever"]),
            ("Choose the preposition + relative pronoun: 'They discussed the complex criteria by ____ the scholarship recipients are selected.'", "which", ["that", "where", "what"]),
            ("Choose the compound relative adverb: '____ you travel in the world, you will encounter diverse cultural traditions.'", "Wherever", ["Whenever", "However", "Whatever"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Prepositions cannot be followed by the relative pronoun 'that'; use 'in/upon/through + which' for things or 'to/with + whom' for persons.",
            "Compound relative pronouns (whoever, whichever, whatever) incorporate their antecedents and function as noun or adverbial clauses.",
            f"'{ans}' correctly adheres to advanced relative clause syntax."
        )

    elif skill_id == "e.h2.vocab":
        items = [
            ("Which academic word means 'an unintended consequence that contradicts the original goal of an action'?", "perverse outcome", ["optimal solution", "linear progression", "deliberate success"]),
            ("Which academic word means 'the capacity of an ecological or economic system to absorb disturbance and reorganize'?", "resilience", ["fragility", "stagnation", "vulnerability"]),
            ("Which academic word means 'an apparent contradiction that reveals a deeper underlying truth upon closer analysis'?", "paradox", ["truism", "tautology", "fallacy"]),
            ("Which academic word means 'to separate or decouple two interconnected processes so they operate independently'?", "decouple", ["integrate", "amalgamate", "synthesize"]),
            ("Which academic word means 'existing everywhere at the same time; widespread and constantly encountered'?", "ubiquitous", ["ephemeral", "scarce", "localized"]),
            ("Which academic word means 'a deviation or departure from what is standard, normal, or expected'?", "anomaly", ["norm", "prototype", "benchmark"]),
            ("Which academic word means 'to clarify, explain, or shed light upon an obscure or complicated subject'?", "elucidate", ["obscure", "confuse", "distort"]),
            ("Which academic word means 'based on observation or experimental experience rather than purely theoretical deduction'?", "empirical", ["speculative", "dogmatic", "hypothetical"]),
            ("Which academic word means 'the quality of being open to more than one interpretation; inexactness'?", "ambiguity", ["clarity", "precision", "transparency"]),
            ("Which academic word means 'characterized by great care, extreme thoroughness, and attention to detail'?", "meticulous", ["negligent", "reckless", "cursory"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Analyze the academic register and precise epistemological definition required by the context.",
            "Eliminate choices that represent antonyms or superficial approximations.",
            f"'{ans}' is the precise academic vocabulary word corresponding to the definition."
        )

    elif skill_id == "e.h2.logic":
        items = [
            ("Which sentence does NOT logically belong in the following paragraph? '(1) Coral reefs protect coastlines from ocean waves. (2) They support thousands of marine species. (3) Space exploration requires substantial annual national budget allocations. (4) Protecting reefs is essential for marine biodiversity.'", "Sentence (3)", ["Sentence (1)", "Sentence (2)", "Sentence (4)"]),
            ("Which sentence does NOT logically belong in the following paragraph? '(1) Renewable wind energy generates electricity with zero carbon emissions. (2) Modern wind turbines have become increasingly efficient. (3) Ancient Egyptian pharaohs constructed massive pyramid tombs. (4) Wind energy plays a vital role in national decarbonization goals.'", "Sentence (3)", ["Sentence (1)", "Sentence (2)", "Sentence (4)"]),
            ("Which sentence does NOT logically belong in the following paragraph? '(1) Sleep plays a crucial role in consolidating newly learned memories. (2) During deep sleep, the brain removes toxic metabolic waste. (3) Classical Greek philosophy developed foundational logical syllogisms. (4) Chronic sleep deprivation impairs executive decision-making.'", "Sentence (3)", ["Sentence (1)", "Sentence (2)", "Sentence (4)"]),
            ("Which sentence does NOT logically belong in the following paragraph? '(1) Desalination technology provides freshwater to arid coastal populations. (2) Modern reverse osmosis membranes operate with improved thermodynamic efficiency. (3) The printing press facilitated widespread European literacy in the Renaissance. (4) Managing concentrated brine byproduct remains an important environmental consideration.'", "Sentence (3)", ["Sentence (1)", "Sentence (2)", "Sentence (4)"]),
            ("Identify the illogical transition: 'The company suffered massive financial losses during the quarter; therefore, it expanded its executive hiring bonuses.' Which transition should replace 'therefore'?", "nevertheless", ["furthermore", "consequently", "similarly"]),
            ("Identify the illogical transition: 'The climate model successfully predicted temperature increases; however, empirical satellite observations verified the predictions.' Which transition should replace 'however'?", "indeed", ["nevertheless", "in contrast", "conversely"]),
            ("Which sentence disrupts paragraph coherence? '(1) Regular aerobic exercise improves cardiovascular health and stamina. (2) It stimulates the release of mood-enhancing neurotransmitters. (3) Commercial airline pilots must undergo extensive flight simulation training. (4) Consistent physical activity reduces the risk of chronic metabolic diseases.'", "Sentence (3)", ["Sentence (1)", "Sentence (2)", "Sentence (4)"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Track the thematic thread and unified topic sentence across all propositions in the paragraph.",
            "Identify the outlier sentence that introduces an unrelated subject, disrupting coherence.",
            f"'{ans}' disrupts the logical flow and cohesion of the paragraph."
        )

    # --- H3 SKILLS ---
    elif skill_id == "e.h3.par":
        items = [
            ("Choose the sentence with correct grammatical parallelism: 'The candidate promised to lower inflation, ____, and support small businesses.'", "create new employment opportunities", ["creating new employment opportunities", "to have created employment opportunities", "new employment opportunities will be created"]),
            ("Choose the sentence with correct grammatical parallelism: 'Effective public speaking requires clarity of thought, confidence in delivery, and ____.'", "relevance of content", ["to have relevant content", "being relevant in content", "relevantly speaking"]),
            ("Choose the sentence with correct grammatical parallelism: 'She enjoys hiking rugged trails, photographing wildlife, and ____ in open lakes.'", "swimming", ["to swim", "swims", "swam"]),
            ("Choose the sentence with correct parallel structure with correlatives: 'He is interested not only in theoretical physics but also in ____.'", "practical engineering applications", ["to apply practical engineering", "applied practical engineering", "practically applying it"]),
            ("Choose the sentence with correct parallelism: 'To evaluate the proposal is one thing; ____ another.'", "to execute it is", ["executing it is", "it is executed", "having executed it"]),
            ("Choose the sentence with proper structural balance: 'The director demanded that the actors arrive on time, memorize their lines, and ____.'", "respect the stage crew", ["to respect the stage crew", "respecting the stage crew", "should respect the stage crew"]),
            ("Choose the sentence with correct parallelism: 'The research project was praised for its rigorous methodology, insightful analysis, and ____.'", "innovative conclusions", ["to conclude innovatively", "concluding with innovation", "innovatively it concluded"]),
            ("Choose the sentence with correct correlative parallelism: 'Either we address the carbon emissions immediately, or we ____ irreversible environmental damage.'", "risk", ["to risk", "risking", "risked"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Elements joined by coordinating conjunctions (and, but, or) or correlatives (not only... but also) must share identical grammatical form.",
            "Ensure that infinitives, gerunds, or noun phrases maintain strict structural symmetry across the series.",
            f"'{ans}' satisfies the requirement of structural parallelism."
        )

    elif skill_id == "e.h3.tone":
        items = [
            ("What is the author's tone in this passage? 'While the tech firm's quarterly revenue figures appear impressive, a rigorous examination of its underlying accounting reveals unsustainable debt obligations that leadership convenient omitted from the public presentation.'", "Critical and skeptical", ["Celebratory and enthusiastic", "Indifferent and detached", "Nostalgic and sentimental"]),
            ("What is the author's tone in this passage? 'The archaeological discovery of the submerged ancient harbor provides invaluable empirical evidence regarding maritime trade networks in the Hellenistic era, corroborating ancient textual accounts with remarkable fidelity.'", "Objective and scholarly", ["Angry and resentful", "Humorous and satirical", "Anxious and fearful"]),
            ("What is the author's tone in this passage? 'If current deforestation rates continue unabated, we face the catastrophic extinction of irreplaceable ecosystems and the irreversible destabilization of global climate systems within our lifetimes.'", "Urgent and cautionary", ["Optimistic and carefree", "Passive and detached", "Cynical and mocking"]),
            ("What is the author's tone in this passage? 'It is absurd to imagine that slapping solar panels on suburban McMansions will magically solve global ecological overshoot while consumer consumption continues to escalate without limit.'", "Sarcastic and provocative", ["Sympathetic and soothing", "Formal and neutral", "Uncertain and hesitant"]),
            ("What is the author's tone in this passage? 'The artist's retrospective exhibition traces her sixty-year creative evolution, demonstrating how early classical discipline gradually blossomed into daring, visionary abstract expressionism.'", "Appreciative and admiring", ["Disapproving and harsh", "Indifferent and objective", "Fearful and suspicious"]),
            ("What is the author's tone in this passage? 'Controlled double-blind clinical trials confirmed that the experimental therapeutic compound reduced cellular inflammation markers by 42% compared to the placebo cohort (p < 0.001).'", "Neutral and clinical", ["Emotional and impassioned", "Bitter and sarcastic", "Humorous and playful"]),
            ("What is the author's tone in this passage? 'One can only chuckle at the grand proclamations of tech evangelists who promise that decentralized algorithms will miraculously eliminate human selfishness and greed.'", "Satirical and amused", ["Grave and mournful", "Terrified and alarmed", "Solemn and devout"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Evaluate word choice, connotative adjectives, and rhetorical devices to discern the author's underlying attitude.",
            "Distinguish between neutral exposition, enthusiastic advocacy, and critical skepticism.",
            f"'{ans}' accurately characterizes the rhetorical tone of the passage."
        )

    elif skill_id == "e.h3.ins":
        items = [
            ("Where does the sentence best fit? '[Sentence: In contrast, secondary batteries can be recharged hundreds of times, making them far more sustainable for consumer electronics.]' Paragraph: '(1) Primary batteries produce electricity through irreversible chemical reactions and must be disposed of after discharge. (2) [A] This single-use design generates substantial electronic waste. (3) [B] Today, lithium-ion formulations dominate the global market for portable devices. (4) [C] Further research aims to replace rare cobalt with more abundant materials. (5) [D]'", "Position [B]", ["Position [A]", "Position [C]", "Position [D]"]),
            ("Where does the sentence best fit? '[Sentence: However, this increased cognitive efficiency comes at a cost when novel creative thinking is required.]' Paragraph: '(1) Routine habits allow the human brain to automate everyday decisions, conserving vital glucose and mental bandwidth. (2) [A] When faced with familiar situations, automated neural routines execute effortlessly. (3) [B] Rigid cognitive heuristics can prevent individuals from recognizing non-linear solutions. (4) [C] Flexible problem-solving often necessitates overriding automated instinctual responses. (5) [D]'", "Position [B]", ["Position [A]", "Position [C]", "Position [D]"]),
            ("Where does the sentence best fit? '[Sentence: Furthermore, these autonomous sensor networks collect ocean temperature data continuously across all seasons.]' Paragraph: '(1) Traditional oceanographic research relied on sporadic research vessel expeditions that surveyed narrow geographical transects. (2) [A] Modern ocean monitoring employs fleets of autonomous robotic floats drifting at varying depths. (3) [B] This uninterrupted stream of real-time measurements has transformed our understanding of marine heatwaves. (4) [C] Climate scientists can now calibrate satellite observations against direct oceanic probes. (5) [D]'", "Position [B]", ["Position [A]", "Position [C]", "Position [D]"]),
            ("Where does the sentence best fit? '[Sentence: Consequently, ancient manuscript copyists often inadvertently introduced minor transcription errors into subsequent editions.]' Paragraph: '(1) Prior to the development of the printing press, all textual works had to be reproduced by hand over months of painstaking labor. (2) [A] Scribes worked long hours in candlelit scriptoriums under exhausting physical conditions. (3) [B] Over successive generations, small textual variations accumulated, creating distinct manuscript lineages. (4) [C] Modern textual scholars carefully collate these surviving variants to reconstruct original archetypes. (5) [D]'", "Position [B]", ["Position [A]", "Position [C]", "Position [D]"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Analyze discourse connectives (In contrast, However, Consequently, Furthermore) and noun-pronoun references in the sentence to be inserted.",
            "Determine where the sentence logically bridges the preceding claim and the succeeding development.",
            f"'{ans}' is the optimal position that preserves logical coherence."
        )

    elif skill_id == "e.h3.col":
        items = [
            ("Choose the correct academic collocation: 'The empirical data ____ the researcher's initial hypothesis.'", "supports", ["holds", "takes", "carries"]),
            ("Choose the correct academic collocation: 'The newly elected administration promised to ____ urgent measures against inflation.'", "implement", ["perform", "practice", "exercise"]),
            ("Choose the correct academic collocation: 'Researchers must ____ consideration to potential ethical ramifications.'", "give due", ["make proper", "do careful", "take full of"]),
            ("Choose the correct academic collocation: 'Her pioneering work ____ a significant contribution to molecular genetics.'", "made", ["did", "performed", "achieved"]),
            ("Choose the correct academic collocation: 'The unexpected economic crisis ____ a severe threat to global supply chains.'", "poses", ["stands", "sets", "places"]),
            ("Choose the correct academic collocation: 'Scientists have yet to ____ consensus on the exact mechanisms of dark matter.'", "reach a", ["touch a", "catch a", "make a"]),
            ("Choose the correct academic collocation: 'The findings ____ doubt on the validity of previous assumptions.'", "cast", ["threw", "spread", "dropped"]),
            ("Choose the correct academic collocation: 'He ____ great emphasis on the importance of empirical replication.'", "placed", ["put on", "laid at", "took"]),
            ("Choose the correct academic collocation: 'The sudden disruption ____ serious implications for food security.'", "carries", ["leads", "conducts", "bears to"]),
            ("Choose the correct academic collocation: 'The government failed to ____ the criteria established by the international treaty.'", "meet", ["fill", "reach", "complete"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Academic collocations represent established verb-noun and adjective-noun pairings standard in scholarly discourse.",
            "Common academic verbs pair with specific abstract nouns (pose a threat, cast doubt, reach consensus, implement measures).",
            f"'{ans}' represents the natural, standard academic collocation."
        )

    elif skill_id == "e.h3.sum":
        items = [
            ("Which sentence best synthesizes the arguments in the passage? 'Passage A argues that artificial intelligence will inevitably automate creative cognitive labor, causing widespread economic displacement. Passage B contends that historical technological disruptions consistently engender novel, higher-order vocations that cannot be anticipated during transition phases.'", "Both passages examine labor disruption while differing on whether automation permanently eliminates or transforms cognitive work.", ["Both passages agree that technological progress should be banned to preserve employment.", "Passage A proves that all human labor will become extinct within five years.", "Passage B asserts that no worker has ever suffered transitional unemployment."]),
            ("Which statement best summarizes the following passage? 'Recent climate models indicate that preserving biodiversity and restoring natural coastal wetlands can significantly buffer coastal communities against storm surges while sequestering large quantities of blue carbon.'", "Restoring coastal wetlands provides both storm protection and vital carbon sequestration.", ["Wetlands are too costly to maintain and offer no measurable climate benefits.", "Storm surges cannot be mitigated through ecological restoration alone.", "Carbon sequestration is effective only in high-altitude mountain forests."]),
            ("Which statement best synthesizes the two viewpoints? 'Proponents of urban densification argue that compact cities reduce per capita carbon emissions and preserve rural ecosystems. Critics counter that excessive density exacerbates urban heat islands and strains local municipal infrastructure.'", "Urban densification offers significant environmental efficiencies but presents municipal and microclimate challenges.", ["Urban density has no measurable impact on environmental sustainability.", "Cities should completely abandon public infrastructure development.", "Rural ecosystems are solely responsible for urban heat island effects."]),
            ("Which sentence best summarizes the passage? 'Metacognitive awareness—the ability to reflect on and regulate one's own learning strategies—has been shown to be a stronger predictor of academic achievement than innate intelligence alone.'", "Metacognitive regulation is a critical determinant of academic success that surpasses innate ability alone.", ["Innate intelligence is the only factor that dictates educational performance.", "Reflecting on learning strategies has no positive correlation with achievement.", "Students should avoid monitoring their own comprehension processes."]),
            ("Which statement best synthesizes the text? 'While digital platforms democratize global communication and market access for small enterprises, algorithmic filtering often creates echo chambers that amplify political polarization.'", "Digital platforms offer economic democratization while simultaneously posing risks of socio-political polarization.", ["Digital platforms have had purely destructive impacts on global commerce.", "Algorithmic filtering completely eliminates political disagreements.", "Small enterprises cannot utilize digital communication platforms effectively."])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "A successful synthesis captures the central thesis and bridges conflicting perspectives into a balanced, comprehensive conclusion.",
            "Avoid choices that oversimplify by taking one extreme side or misrepresent the core arguments.",
            f"'{ans}' accurately synthesizes the core perspectives presented in the text."
        )

    return ("Default prompt", "Default answer", ["d1", "d2", "d3"], "Hint 1", "Hint 2", "Exp")
