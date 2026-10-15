# E1 & E2 Data Generators (10 skills total)
# E1: e.e1.alpha, e.e1.greet, e.e1.numcol, e.e1.family, e.e1.class
# E2: e.e2.noun, e.e2.verb, e.e2.like, e.e2.sent, e.e2.read

def get_e1_e2_item(skill_id, i):
    # --- E1 SKILLS ---
    if skill_id == "e.e1.alpha":
        alpha_table = [
            ("A", "Apple", "a red fruit that grows on trees", ["B", "C", "D"]),
            ("B", "Ball", "a round object used in games", ["D", "P", "R"]),
            ("C", "Cat", "a small furry animal that says meow", ["G", "O", "K"]),
            ("D", "Dog", "a friendly pet that barks", ["B", "P", "T"]),
            ("E", "Elephant", "a very large animal with a long trunk", ["F", "L", "I"]),
            ("F", "Fish", "an animal that swims in the water", ["E", "P", "T"]),
            ("G", "Giraffe", "a tall animal with a very long neck", ["J", "C", "Q"]),
            ("H", "Hat", "something you wear on your head", ["A", "N", "M"]),
            ("I", "Igloo", "a dome-shaped house built of snow blocks", ["E", "L", "T"]),
            ("J", "Juice", "a refreshing drink made from fruit", ["G", "Y", "I"]),
            ("K", "Kite", "a light toy that flies in the wind", ["C", "T", "H"]),
            ("L", "Lion", "a large wild cat known as the king of the jungle", ["I", "T", "F"]),
            ("M", "Monkey", "a playful animal that climbs trees", ["N", "W", "H"]),
            ("N", "Nest", "a home that birds build for their eggs", ["M", "H", "U"]),
            ("O", "Orange", "a round citrus fruit of orange color", ["C", "Q", "U"]),
            ("P", "Pencil", "a tool with graphite used for writing and drawing", ["B", "D", "Q"]),
            ("Q", "Queen", "a female royal ruler of a kingdom", ["O", "G", "P"]),
            ("R", "Rabbit", "a small furry animal with long ears", ["B", "P", "K"]),
            ("S", "Sun", "the bright star that lights our daytime sky", ["C", "Z", "X"]),
            ("T", "Tiger", "a large wild cat with black stripes", ["D", "F", "L"]),
            ("U", "Umbrella", "a device used for protection from rain", ["V", "O", "Y"]),
            ("V", "Violin", "a musical instrument played with a bow", ["U", "W", "F"]),
            ("W", "Whale", "a huge mammal living in the ocean", ["M", "V", "U"]),
            ("X", "Xylophone", "a musical instrument with wooden bars struck by mallets", ["Z", "S", "K"]),
            ("Y", "Yacht", "a medium-sized sailboat used for racing or cruising", ["J", "U", "V"]),
            ("Z", "Zebra", "an African wild horse with black and white stripes", ["S", "X", "C"])
        ]
        sub = i % 4
        base = alpha_table[(i // 4) % len(alpha_table)]
        letter, word, desc, dists = base
        if sub == 0:
            return (
                f"What is the correct uppercase first letter for the word '{word}'?",
                letter, dists,
                "Listen closely to the initial sound of the word.",
                f"The word '{word}' begins with this specific letter of the alphabet.",
                f"'{word}' begins with the uppercase letter '{letter}'."
            )
        elif sub == 1:
            lower = letter.lower()
            lower_dists = [d.lower() for d in dists]
            return (
                f"Which lowercase letter matches the uppercase letter '{letter}'?",
                lower, lower_dists,
                "Think about the lowercase pair for this uppercase letter.",
                f"Compare the shape of the lowercase partner with uppercase '{letter}'.",
                f"The lowercase letter '{lower}' corresponds to uppercase '{letter}'."
            )
        elif sub == 2:
            next_l = chr(((ord(letter) - ord('A') + 1) % 26) + ord('A'))
            prev_l = chr(((ord(letter) - ord('A') - 1) % 26) + ord('A'))
            return (
                f"Which word starts with the letter '{letter}'?",
                word, ["Book" if word != "Book" else "Desk", "Tree" if word != "Tree" else "Rain", "Water" if word != "Water" else "Sun"],
                "Look at the initial sound of each given option.",
                f"One of the choices describes {desc}.",
                f"'{word}' correctly starts with the letter '{letter}'."
            )
        else:
            return (
                f"Which letter comes directly after '{chr(((ord(letter) - ord('A') - 1) % 26) + ord('A'))}' in alphabetical order?",
                letter, dists,
                "Recite the alphabet song or sequence in order.",
                "Identify the letter that immediately follows in the ABC sequence.",
                f"'{letter}' is the letter that immediately follows in alphabetical order."
            )

    elif skill_id == "e.e1.greet":
        scenarios = [
            ("in the morning when you meet your teacher", "Good morning.", ["Good night.", "Goodbye.", "See you tomorrow."]),
            ("in the afternoon around 2 PM", "Good afternoon.", ["Good morning.", "Good night.", "Sweet dreams."]),
            ("in the evening when greeting a neighbor", "Good evening.", ["Good morning.", "Goodbye.", "I am tired."]),
            ("before going to sleep at night", "Good night.", ["Good morning.", "Hello.", "Nice to meet you."]),
            ("when parting with a classmate after school", "Goodbye, see you tomorrow.", ["Good morning.", "Hello.", "I am eight."]),
            ("when meeting a new friend for the first time", "Nice to meet you.", ["Good night.", "I am sorry.", "You are welcome."]),
            ("when someone gives you a gift", "Thank you very much.", ["I am sorry.", "Goodbye.", "No, I do not."]),
            ("in response to 'Thank you'", "You are welcome.", ["I am fine.", "Good morning.", "Yes, please."]),
            ("when you accidentally bump into someone", "I am sorry.", ["Thank you.", "Hello.", "Goodbye."]),
            ("when greeting a friend casually", "Hello, how are you?", ["Good night.", "Goodbye.", "I am sorry."]),
            ("when someone asks 'How are you?'", "I am fine, thank you.", ["Good night.", "Goodbye.", "My name is Sam."]),
            ("when leaving someone's house", "Have a great day.", ["Good night.", "Hello.", "I am twelve."])
        ]
        base = scenarios[i % len(scenarios)]
        sit, ans, dists = base
        variant_intro = ["Which greeting is appropriate", "What is the best expression to use", "What should you politely say"][i % 3]
        return (
            f"{variant_intro} {sit}?",
            ans, dists,
            "Think about the social situation and the time or context.",
            "Choose the polite and natural social greeting for this specific moment.",
            f"'{ans}' is the standard, natural English greeting used {sit}."
        )

    elif skill_id == "e.e1.numcol":
        numcol_items = [
            ("an apple", "red", ["blue", "purple", "black"]),
            ("the clear midday sky", "blue", ["yellow", "green", "red"]),
            ("a ripe banana", "yellow", ["blue", "purple", "brown"]),
            ("fresh grass in spring", "green", ["orange", "pink", "black"]),
            ("a carrot", "orange", ["blue", "white", "black"]),
            ("a flamingo", "pink", ["green", "blue", "gray"]),
            ("fresh snow in winter", "white", ["black", "brown", "green"]),
            ("the night sky without stars", "black", ["yellow", "pink", "orange"]),
            ("chocolate cake", "brown", ["blue", "green", "yellow"]),
            ("an elephant's skin", "gray", ["red", "yellow", "orange"]),
            ("one plus one", "two", ["four", "five", "six"]),
            ("the number of fingers on one hand", "five", ["two", "seven", "nine"]),
            ("the number of days in a week", "seven", ["three", "six", "eight"]),
            ("the number of wheels on a standard car", "four", ["one", "five", "eight"]),
            ("the number of legs on a spider", "eight", ["four", "six", "ten"]),
            ("the number of months in a year", "twelve", ["ten", "eleven", "nine"]),
            ("five plus five", "ten", ["eight", "seven", "nine"]),
            ("three plus three", "six", ["five", "seven", "four"]),
            ("seven plus two", "nine", ["six", "eight", "ten"]),
            ("the number of hours in a full day", "twenty-four", ["twelve", "ten", "twenty"])
        ]
        base = numcol_items[i % len(numcol_items)]
        target_name, ans, dists = base
        q_type = "color" if ans in ["red", "blue", "yellow", "green", "orange", "pink", "white", "black", "brown", "gray"] else "number"
        prompt = f"Which {q_type} word best describes {target_name}?" if q_type == "color" else f"What is {target_name}?"
        return (
            prompt,
            ans, dists,
            f"Think about the natural {q_type} or count of this item.",
            f"Consider everyday facts to determine the correct {q_type} word.",
            f"'{ans}' is the correct {q_type} word describing {target_name}."
        )

    elif skill_id == "e.e1.family":
        family_items = [
            ("a female parent", "mother", ["father", "brother", "uncle"]),
            ("a male parent", "father", ["mother", "sister", "aunt"]),
            ("a female sibling", "sister", ["brother", "father", "grandfather"]),
            ("a male sibling", "brother", ["sister", "mother", "grandmother"]),
            ("the mother of your parent", "grandmother", ["grandfather", "sister", "aunt"]),
            ("the father of your parent", "grandfather", ["grandmother", "brother", "uncle"]),
            ("the sister of your parent", "aunt", ["uncle", "mother", "sister"]),
            ("the brother of your parent", "uncle", ["aunt", "father", "brother"]),
            ("the child of your aunt or uncle", "cousin", ["brother", "sister", "grandfather"]),
            ("both your mother and father together", "parents", ["cousins", "grandparents", "siblings"]),
            ("a very young infant member of the family", "baby", ["grandfather", "uncle", "aunt"])
        ]
        base = family_items[i % len(family_items)]
        desc, ans, dists = base
        variant_prompts = [
            f"Which family word refers to '{desc}'?",
            f"What do we call '{desc}' in English?",
            f"Choose the correct family member term for '{desc}':"
        ]
        prompt = variant_prompts[i % len(variant_prompts)]
        return (
            prompt,
            ans, dists,
            "Look at the family relationship clue carefully.",
            "Identify the kinship term that matches this family role.",
            f"The word '{ans}' specifically refers to {desc}."
        )

    elif skill_id == "e.e1.class":
        class_items = [
            ("an instrument with graphite used for writing or drawing", "pencil", ["eraser", "ruler", "bag"]),
            ("a bound collection of printed pages for reading", "book", ["chair", "desk", "pencil"]),
            ("a flat-topped piece of furniture where students write", "desk", ["chair", "book", "door"]),
            ("a piece of furniture designed for one person to sit on", "chair", ["desk", "ruler", "pen"]),
            ("a small rubber item used to rub out pencil marks", "eraser", ["pencil", "notebook", "scissors"]),
            ("a container with straps used to carry school supplies", "backpack", ["pencil", "book", "chair"]),
            ("a straight-edged tool used to draw lines and measure length", "ruler", ["crayon", "bag", "clock"]),
            ("a book with blank lined pages used for writing notes", "notebook", ["ruler", "desk", "chair"]),
            ("a colored wax stick used for drawing and coloring", "crayon", ["pen", "eraser", "ruler"]),
            ("a tool with two pivoted blades used for cutting paper", "scissors", ["glue", "pencil", "bag"]),
            ("a substance used for sticking paper pieces together", "glue", ["pencil", "scissors", "ruler"])
        ]
        base = class_items[i % len(class_items)]
        desc, ans, dists = base
        return (
            f"Which classroom item is described as '{desc}'?",
            ans, dists,
            "Consider the function and everyday use of classroom objects.",
            "Match the school tool to its specific educational purpose.",
            f"A '{ans}' is {desc}."
        )

    # --- E2 SKILLS ---
    elif skill_id == "e.e2.noun":
        noun_items = [
            ("Which word is a noun naming an animal?", "cat", ["run", "fast", "blue"]),
            ("Which word is a noun naming a place where people read books?", "library", ["swim", "quickly", "loud"]),
            ("Which word is a noun naming a piece of fruit?", "apple", ["jump", "happy", "slowly"]),
            ("Which word is a noun naming an everyday object?", "chair", ["sleep", "softly", "bright"]),
            ("What is the plural form of the noun 'book'?", "books", ["booking", "booked", "bookes"]),
            ("What is the plural form of the noun 'dog'?", "dogs", ["doges", "doging", "doged"]),
            ("What is the plural form of the noun 'box'?", "boxes", ["boxs", "boxing", "boxen"]),
            ("What is the plural form of the noun 'bus'?", "buses", ["buss", "busing", "bused"]),
            ("Which word is a proper noun naming a day of the week?", "Monday", ["today", "yesterday", "tomorrow"]),
            ("Which word is a noun naming a person?", "teacher", ["teach", "brightly", "running"]),
            ("Which word in the sentence is a noun? 'The small puppy plays in the yard.'", "puppy", ["small", "plays", "in"]),
            ("Which word in the sentence is a noun? 'My sister eats a sweet orange.'", "sister", ["sweet", "eats", "my"])
        ]
        base = noun_items[i % len(noun_items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "A noun is a naming word that identifies a person, place, animal, or thing.",
            "Determine which choice functions as a naming word or correct plural form.",
            f"'{ans}' is the correct noun choice in this sentence."
        )

    elif skill_id == "e.e2.verb":
        verb_items = [
            ("Which word is an action verb?", "jump", ["apple", "happy", "chair"]),
            ("Which word describes a physical action?", "run", ["table", "blue", "quiet"]),
            ("Choose the verb that completes the sentence: 'Fish ____ in the deep ocean.'", "swim", ["river", "shiny", "water"]),
            ("Choose the verb that completes the sentence: 'Birds ____ in the morning sky.'", "fly", ["tree", "green", "wind"]),
            ("Choose the verb that completes the sentence: 'Children ____ books in the library.'", "read", ["happy", "desk", "paper"]),
            ("Choose the correct verb form: 'The cat ____ on the rug every afternoon.'", "sleeps", ["sleep", "sleeping", "is sleep"]),
            ("Choose the correct verb form: 'The dogs ____ loudly in the park.'", "bark", ["barks", "barking", "is bark"]),
            ("Which word in the sentence is a verb? 'Emma sings a lovely song.'", "sings", ["Emma", "lovely", "song"]),
            ("Which word in the sentence is a verb? 'Leo kicks the soccer ball.'", "kicks", ["Leo", "soccer", "ball"]),
            ("Choose the action verb: 'We ____ lunch together at school.'", "eat", ["sandwich", "hungry", "lunch"])
        ]
        base = verb_items[i % len(verb_items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "A verb expresses an action, state, or occurrence.",
            "Look for the word that tells what the subject does.",
            f"'{ans}' correctly functions as an action verb in this context."
        )

    elif skill_id == "e.e2.like":
        like_items = [
            ("Choose the sentence with correct subject-verb agreement:", "I like apples.", ["I likes apples.", "I liking apples.", "I am like apples."]),
            ("Choose the correct verb form: 'She ____ reading comic books.'", "likes", ["like", "are like", "liking"]),
            ("Choose the correct verb form: 'He ____ playing soccer after school.'", "likes", ["like", "is like", "liking"]),
            ("Choose the sentence with correct subject-verb agreement:", "We like playing outdoor games.", ["We likes playing outdoor games.", "We are like games.", "We liking games."]),
            ("Choose the sentence expressing a negative preference:", "They do not like cold weather.", ["They does not like cold weather.", "They not like cold weather.", "They are not like cold weather."]),
            ("Choose the correct negative sentence:", "He does not like sour lemons.", ["He do not like sour lemons.", "He not likes sour lemons.", "He is not like sour lemons."]),
            ("Choose the correct question form:", "Do you like sweet strawberries?", ["Does you like sweet strawberries?", "Are you like sweet strawberries?", "Like you sweet strawberries?"]),
            ("Choose the correct question form:", "Does she like drawing pictures?", ["Do she like drawing pictures?", "Is she like drawing pictures?", "Likes she drawing pictures?"])
        ]
        base = like_items[i % len(like_items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Use 'like' with I/you/we/they and 'likes' with third-person singular he/she/it.",
            "Negative sentences use 'do not like' or 'does not like' with base verb 'like'.",
            f"'{ans}' correctly follows grammatical rules for expressing preference."
        )

    elif skill_id == "e.e2.sent":
        sent_items = [
            ("Choose the correctly ordered sentence:", "This is a red ball.", ["Red ball is a this.", "Is this a red ball.", "A this is red ball."]),
            ("Choose the correctly ordered sentence:", "I have a small puppy.", ["Have I a puppy small.", "A small puppy have I.", "Small puppy I have a."]),
            ("Choose the correctly ordered sentence:", "The bright sun shines.", ["Shines the sun bright.", "Sun the bright shines.", "Bright the sun shines."]),
            ("Choose the correctly ordered sentence:", "She reads an exciting book.", ["An exciting book she reads.", "Reads she an exciting book.", "Book she reads an exciting."]),
            ("Which sentence ends with the correct punctuation?", "Where is my blue backpack?", ["Where is my blue backpack.", "Where is my blue backpack!", "Where is my blue backpack,"]),
            ("Choose the correct declarative sentence:", "The birds sing sweet songs.", ["Birds the sing sweet songs.", "Sweet songs sing the birds.", "Sing the birds sweet songs."]),
            ("Which word order makes a natural English sentence?", "We play games together.", ["Together play we games.", "Games we play together.", "Play we games together."])
        ]
        base = sent_items[i % len(sent_items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Standard English word order begins with the Subject, followed by the Verb and Object.",
            "Make sure the sentence follows natural, standard English syntax and punctuation.",
            f"'{ans}' follows standard Subject-Verb-Object word order."
        )

    elif skill_id == "e.e2.read":
        read_items = [
            ("Read: 'The brown cat is on the soft mat. It is sleeping quietly.' Where is the cat?", "On the soft mat", ["In the tall tree", "Under the table", "In the cold water"]),
            ("Read: 'Tom has a red bicycle. He rides his bicycle in the park.' What does Tom ride?", "A red bicycle", ["A blue skateboard", "A big yellow bus", "A green scooter"]),
            ("Read: 'Anna loves sweet apples. She eats a crunchy apple every afternoon.' What does Anna eat?", "A crunchy apple", ["A warm cookie", "A yellow banana", "A slice of pizza"]),
            ("Read: 'The bright sun is in the morning sky. Birds are singing in the green trees.' What is in the sky?", "The bright sun", ["The silver moon", "A dark storm cloud", "A flying kite"]),
            ("Read: 'Sam and Lucy go to the library. They find two interesting books.' How many books do they find?", "Two books", ["Four books", "One book", "Three books"]),
            ("Read: 'Max is a playful puppy. He wags his tail when he sees his ball.' What does Max wag?", "His tail", ["His ears", "His paws", "His leash"]),
            ("Read: 'Emily has three colored pencils. Her favorite pencil is purple.' What is Emily's favorite color?", "Purple", ["Green", "Orange", "Yellow"])
        ]
        base = read_items[i % len(read_items)]
        q, ans, dists = base
        return (
            q, ans, dists,
            "Read the short passage attentively and identify the key factual detail.",
            "The correct answer is directly stated in the text.",
            f"Based on the text, '{ans}' is the accurate factual answer."
        )

    return ("Default prompt", "Default answer", ["d1", "d2", "d3"], "Hint 1", "Hint 2", "Exp")
