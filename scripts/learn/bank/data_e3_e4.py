# E3 & E4 Data Generators (10 skills total)
# E3: e.e3.build, e.e3.pron, e.e3.tense, e.e3.routine, e.e3.read
# E4: e.e4.tense, e.e4.qneg, e.e4.adj, e.e4.prep, e.e4.read

def get_e3_e4_item(skill_id, i):
    if skill_id == "e.e3.build":
        items = [
            ("Choose the sentence with correct word order:", "The boy plays soccer in the park.", ["Plays soccer the boy in the park.", "Soccer the boy plays in the park.", "The boy in the park soccer plays."]),
            ("Choose the sentence with correct word order:", "She reads an interesting book every night.", ["An interesting book she reads every night.", "Reads she an interesting book every night.", "She every night an interesting book reads."]),
            ("Choose the sentence with correct word order:", "They eat lunch together at noon.", ["Eat they lunch together at noon.", "Lunch they eat together at noon.", "They together lunch eat at noon."]),
            ("Choose the sentence with correct word order:", "My sister draws colorful pictures.", ["Draws colorful pictures my sister.", "Colorful pictures my sister draws.", "My sister pictures colorful draws."]),
            ("Choose the correctly structured sentence:", "The teacher writes words on the board.", ["Writes the teacher words on the board.", "Words the teacher writes on the board.", "The teacher on the board writes words."]),
            ("Choose the correctly structured sentence:", "We listen to the lively music.", ["Listen we to the lively music.", "To the lively music we listen.", "We the lively music listen to."]),
            ("Choose the correctly structured sentence:", "The birds build a sturdy nest.", ["Build the birds a sturdy nest.", "A sturdy nest the birds build.", "The birds a sturdy nest build."]),
            ("Choose the correctly structured sentence:", "He opens the wooden window quietly.", ["Opens he the wooden window quietly.", "The wooden window he opens quietly.", "He quietly the wooden window opens."])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "English declarative sentences generally follow Subject + Verb + Object + Place/Time.",
            "Identify the sentence where the subject begins, followed immediately by the predicate verb.",
            f"'{ans}' properly follows Subject + Verb + Object standard English word order."
        )

    elif skill_id == "e.e3.pron":
        items = [
            ("Choose the correct pronoun: 'Tom is very happy. ____ smiles brightly.'", "He", ["She", "It", "They"]),
            ("Choose the correct pronoun: 'Mary has a new book. ____ reads it every day.'", "She", ["He", "It", "They"]),
            ("Choose the correct pronoun: 'The puppy is hungry. ____ drinks some milk.'", "It", ["He", "She", "They"]),
            ("Choose the correct pronoun: 'The students are singing. ____ are in the music room.'", "They", ["He", "She", "It"]),
            ("Choose the correct object pronoun: 'Look at Sarah. I want to talk to ____.'", "her", ["him", "them", "it"]),
            ("Choose the correct object pronoun: 'David needs help. Please assist ____.'", "him", ["her", "them", "it"]),
            ("Choose the correct object pronoun: 'We are ready. Come with ____.'", "us", ["me", "them", "him"]),
            ("Choose the correct object pronoun: 'The books are heavy. Please carry ____.'", "them", ["it", "him", "her"]),
            ("Choose the correct possessive: 'This is my sister. ____ name is Chloe.'", "Her", ["His", "Its", "Their"]),
            ("Choose the correct possessive: 'This is my brother. ____ favorite sport is baseball.'", "His", ["Her", "Its", "Our"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Pronouns replace nouns based on gender (male/female), number (singular/plural), and case (subject/object/possessive).",
            "Identify whether the blank requires a subject pronoun, object pronoun, or possessive adjective.",
            f"'{ans}' is the grammatically correct pronoun replacement."
        )

    elif skill_id == "e.e3.tense":
        items = [
            ("Choose the correct past tense verb: 'Yesterday, we ____ soccer after school.'", "played", ["play", "plays", "playing"]),
            ("Choose the correct past tense verb: 'Last night, she ____ her favorite television show.'", "watched", ["watch", "watches", "watching"]),
            ("Choose the correct past tense verb: 'Yesterday morning, he ____ to school with his friends.'", "walked", ["walk", "walks", "walking"]),
            ("Choose the correct past tense verb: 'Mom ____ a delicious dinner yesterday.'", "cooked", ["cook", "cooks", "cooking"]),
            ("Choose the correct past tense verb: 'They ____ their bedroom yesterday afternoon.'", "cleaned", ["clean", "cleans", "cleaning"]),
            ("Choose the correct present tense verb: 'He ____ his bicycle to school every day.'", "rides", ["rode", "riding", "ride"]),
            ("Choose the correct present tense verb: 'She ____ a glass of warm milk every evening.'", "drinks", ["drank", "drinking", "drink"]),
            ("Choose the correct present tense verb: 'The sun ____ brightly in the morning.'", "shines", ["shined", "shining", "shine"]),
            ("Choose the correct past tense verb: 'We ____ our grandparents last weekend.'", "visited", ["visit", "visits", "visiting"]),
            ("Choose the correct past tense verb: 'The dog ____ over the low fence yesterday.'", "jumped", ["jump", "jumps", "jumping"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Look for time adverbs like 'yesterday', 'last night' (past) or 'every day' (present simple).",
            "Regular past tense verbs add -ed, while present simple with third-person singular subjects adds -s.",
            f"'{ans}' correctly reflects the temporal context of the sentence."
        )

    elif skill_id == "e.e3.routine":
        items = [
            ("Choose the verb that completes the morning routine: 'I ____ my teeth every morning.'", "brush", ["read", "fly", "jump"]),
            ("Choose the verb that completes the morning routine: 'She ____ breakfast at 7:30 AM.'", "eats", ["watches", "wears", "washes"]),
            ("Choose the expression for going to school: 'We ____ to school on weekdays.'", "walk", ["sleep", "cook", "rest"]),
            ("Choose the expression for waking up: 'He ____ up early every morning.'", "wakes", ["falls", "looks", "stands"]),
            ("Choose the correct bedtime routine: 'Children usually go to ____ at 9 PM.'", "bed", ["class", "park", "store"]),
            ("Choose the correct phrase: 'I wash my ____ before eating meals.'", "hands", ["shoes", "backpack", "desk"]),
            ("Choose the correct evening routine: 'She does her ____ after dinner.'", "homework", ["lunch", "breakfast", "morning"]),
            ("Choose the correct daily habit: 'They ____ books before going to sleep.'", "read", ["swim", "cook", "run"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Consider typical daily life habits and standard verb-noun collocations.",
            "Match the daily habit verb to the specific noun or time of day.",
            f"'{ans}' creates the natural, common daily routine expression."
        )

    elif skill_id == "e.e3.read":
        items = [
            ("Read: 'Sam wakes up at 7 AM. He eats breakfast and walks to school.' How does Sam go to school?", "He walks", ["By school bus", "By bicycle", "By train"]),
            ("Read: 'Lucy has a brown puppy named Max. Max loves running in the green grass.' What color is Max?", "Brown", ["Black", "White", "Golden"]),
            ("Read: 'The library has many books. David reads a story about space there.' Where does David read the story?", "At the library", ["At the zoo", "In the garden", "At the bakery"]),
            ("Read: 'Emma waters the red flowers in the garden every morning.' What does Emma water?", "Red flowers", ["Green trees", "Yellow grass", "Vegetables"]),
            ("Read: 'Jack plays soccer with his friends every Saturday afternoon.' When does Jack play soccer?", "Every Saturday afternoon", ["On Monday morning", "On Friday night", "Every Sunday morning"]),
            ("Read: 'Mia baked sweet chocolate cookies with her grandmother.' Who did Mia bake cookies with?", "Her grandmother", ["Her teacher", "Her brother", "Her cousin"]),
            ("Read: 'A small yellow bird sings on the branch outside the window.' What is the bird doing?", "Singing on the branch", ["Swimming in the river", "Sleeping on the rug", "Eating an apple"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Read the passage carefully to find the specific factual detail requested in the question.",
            "Locate the sentence in the reading that directly mentions the subject and action.",
            f"According to the reading passage, '{ans}' is the correct answer."
        )

    # --- E4 SKILLS ---
    elif skill_id == "e.e4.tense":
        items = [
            ("Choose the correct irregular past tense verb: 'Yesterday, we ____ to the science museum.'", "went", ["go", "goes", "gone"]),
            ("Choose the correct irregular past tense verb: 'She ____ a colorful rainbow in the sky yesterday.'", "saw", ["see", "sees", "seen"]),
            ("Choose the correct irregular past tense verb: 'They ____ delicious pancakes for breakfast this morning.'", "ate", ["eat", "eats", "eaten"]),
            ("Choose the correct irregular past tense verb: 'He ____ a fun party last Saturday.'", "had", ["have", "has", "having"]),
            ("Choose the correct irregular past tense verb: 'I ____ my homework right after dinner yesterday.'", "did", ["do", "does", "done"]),
            ("Choose the correct irregular past tense verb: 'Mom ____ a tasty cake for my birthday.'", "made", ["make", "makes", "making"]),
            ("Choose the correct irregular past tense verb: 'We ____ many photos during our family trip.'", "took", ["take", "takes", "taken"]),
            ("Choose the correct irregular past tense verb: 'Our teacher ____ into the classroom with a smile.'", "came", ["come", "comes", "coming"]),
            ("Choose the correct irregular past tense verb: 'He ____ an exciting adventure book last night.'", "read", ["reads", "reading", "will read"]),
            ("Choose the correct irregular past tense verb: 'She ____ a friendly letter to her pen pal.'", "wrote", ["write", "writes", "written"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Common verbs have irregular past tense forms that do not simply add -ed.",
            "Identify the correct irregular simple past form corresponding to the base verb.",
            f"'{ans}' is the correct irregular past tense form."
        )

    elif skill_id == "e.e4.qneg":
        items = [
            ("Choose the correct auxiliary verb: '____ you like playing badminton?'", "Do", ["Does", "Are", "Is"]),
            ("Choose the correct auxiliary verb: '____ she have a younger brother?'", "Does", ["Do", "Is", "Has"]),
            ("Choose the correct auxiliary verb: '____ they go to the library yesterday?'", "Did", ["Do", "Does", "Were"]),
            ("Choose the grammatically correct negative sentence:", "He does not like cold winter days.", ["He do not like cold winter days.", "He is not like cold winter days.", "He not like cold winter days."]),
            ("Choose the grammatically correct negative sentence:", "They did not watch the movie last night.", ["They did not watched the movie last night.", "They not watched the movie last night.", "They were not watch the movie last night."]),
            ("Choose the correct question form:", "Where does your uncle live?", ["Where do your uncle live?", "Where your uncle lives?", "Where is your uncle live?"]),
            ("Choose the correct question form:", "What did you eat for lunch yesterday?", ["What did you ate for lunch yesterday?", "What do you ate for lunch yesterday?", "What were you eat for lunch yesterday?"]),
            ("Choose the grammatically correct negative sentence:", "I do not have enough pencils.", ["I does not have enough pencils.", "I not have enough pencils.", "I am not have enough pencils."])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Use Do/Don't with I/you/we/they, Does/Doesn't with he/she/it, and Did/Didn't for past tense.",
            "Remember that Do, Does, and Did are always followed by the base form of the main verb.",
            f"'{ans}' correctly applies the rules of question or negative sentence formation."
        )

    elif skill_id == "e.e4.adj":
        items = [
            ("Which adjective describes something with very high temperature?", "hot", ["cold", "slow", "quiet"]),
            ("Which adjective describes something with low temperature?", "cold", ["hot", "loud", "heavy"]),
            ("Choose the adjective that describes size: 'An elephant is an enormous, ____ animal.'", "large", ["loudly", "quickly", "softly"]),
            ("Which adjective is the opposite of 'tall'?", "short", ["wide", "heavy", "bright"]),
            ("Which adjective describes a feeling of happiness and joy?", "cheerful", ["angry", "gloomy", "bored"]),
            ("Which adjective describes someone who shows courage?", "brave", ["fearful", "weak", "cowardly"]),
            ("Choose the adjective that describes sound: 'Thunder makes a very ____ noise.'", "loud", ["quiet", "tiny", "soft"]),
            ("Choose the adjective that describes weight: 'A heavy metal box is not ____.'", "light", ["dark", "cold", "hard"]),
            ("Which adjective describes a bright, sunny day?", "sunny", ["rainy", "stormy", "cloudy"]),
            ("Which adjective is the opposite of 'difficult'?", "easy", ["hard", "complex", "rough"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Adjectives describe qualities, properties, sizes, and states of nouns.",
            "Choose the adjective that matches the specific meaning or opposite required.",
            f"'{ans}' is the appropriate descriptive adjective."
        )

    elif skill_id == "e.e4.prep":
        items = [
            ("Choose the correct preposition: 'The cat is sleeping ____ the soft rug.'", "on", ["between", "into", "through"]),
            ("Choose the correct preposition: 'The pencils are inside ____ the pencil case.'", "in", ["off", "over", "across"]),
            ("Choose the correct preposition: 'The shoes are resting ____ the bed on the floor.'", "under", ["into", "through", "about"]),
            ("Choose the correct preposition: 'The garden is located ____ the two houses.'", "between", ["among", "into", "through"]),
            ("Choose the correct preposition: 'The clock hangs ____ the wall above the desk.'", "on", ["under", "between", "inside"]),
            ("Choose the correct time preposition: 'School starts ____ 8:30 AM every morning.'", "at", ["on", "in", "by"]),
            ("Choose the correct time preposition: 'We have art class ____ Friday afternoon.'", "on", ["at", "in", "to"]),
            ("Choose the correct time preposition: 'Flowers bloom brightly ____ spring.'", "in", ["at", "on", "from"]),
            ("Choose the correct preposition: 'The dog is standing ____ the tree, hidden from view.'", "behind", ["between", "during", "across"]),
            ("Choose the correct preposition: 'There is a bakery ____ to the library.'", "next", ["near", "beside", "close"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Prepositions indicate location, direction, or time relationships.",
            "Use 'at' for specific clock times, 'on' for days/dates, and 'in' for months/seasons/enclosed spaces.",
            f"'{ans}' correctly indicates the spatial or temporal relationship."
        )

    elif skill_id == "e.e4.read":
        items = [
            ("Read: 'Kangaroos live in Australia. They can jump very high and carry their babies in special pouches.' Where do kangaroos live?", "In Australia", ["In Canada", "In Brazil", "In Egypt"]),
            ("Read: 'Honeybees visit colorful flowers to collect nectar. They use the nectar to make sweet honey in their hives.' What do bees make?", "Sweet honey", ["Fresh milk", "Warm bread", "Cheese"]),
            ("Read: 'The sun provides light and heat to our planet. Without the sun, plants could not grow.' What does the sun provide?", "Light and heat", ["Rain and snow", "Wind and dust", "Cold and ice"]),
            ("Read: 'Dolphins are smart marine mammals. They communicate with each other using whistles and clicks.' How do dolphins communicate?", "Using whistles and clicks", ["By writing letters", "Using smoke signals", "By changing color"]),
            ("Read: 'Trees take in carbon dioxide and give off fresh oxygen. They also provide shade on hot summer days.' What do trees give off?", "Fresh oxygen", ["Carbon dioxide", "Salt water", "Heavy smoke"]),
            ("Read: 'The Arctic fox has thick white fur in winter. This warm fur helps it stay hidden in the snow and stay warm.' What color is the Arctic fox's fur in winter?", "White", ["Brown", "Black", "Red"]),
            ("Read: 'Electric trains run on tracks using electricity instead of fossil fuels. They are clean and fast.' What power do electric trains use?", "Electricity", ["Coal and wood", "Gasoline", "Wind power only"])
        ]
        base = items[i % len(items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Read the informational passage carefully to find the directly stated fact.",
            "Check the key nouns and verbs in the text to identify the accurate answer.",
            f"According to the reading text, '{ans}' is the correct answer."
        )

    return ("Default prompt", "Default answer", ["d1", "d2", "d3"], "Hint 1", "Hint 2", "Exp")
