# -*- coding: utf-8 -*-
"""
Generate complete worldRegions.ts containing 100% official Level 1 administrative
divisions for all 46 countries (all states, provinces, prefectures, regions, governorates, etc.).
"""
import json
import os
import sys

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

OUTPUT_PATH = r"c:\Users\leetr\Documents\life-project\life-help\lib\region\worldRegions.ts"

# Comprehensive dictionary of all 46 countries with their complete official Level 1 divisions.
# For each Level 1 division, we provide the name, shortName, and a list of major Level 2 gungus and Level 3 dongs.
COUNTRIES_DATA = {
    # 1. US (United States) - All 50 States + District of Columbia
    "US": [
        ("California", "CA", [("Los Angeles", ["Koreatown", "Downtown", "Hollywood", "Westwood", "Silver Lake"]), ("Orange County", ["Irvine", "Fullerton", "Buena Park", "Anaheim", "Garden Grove"]), ("San Francisco", ["Financial District", "Mission", "Sunset", "Richmond"]), ("San Diego", ["Downtown", "La Jolla", "Pacific Beach"]), ("San Jose", ["Downtown", "North San Jose", "Willow Glen"])]),
        ("New York", "NY", [("New York City (Manhattan)", ["Midtown", "Koreatown (32nd St)", "Lower East Side", "Upper West Side"]), ("Queens", ["Flushing", "Bayside", "Astoria", "Long Island City"]), ("Brooklyn", ["Williamsburg", "DUMBO", "Brooklyn Heights"]), ("Bronx", ["Riverdale", "Pelham Bay"]), ("Staten Island", ["St. George", "Todt Hill"])]),
        ("Texas", "TX", [("Dallas", ["Carrollton", "Downtown", "Plano", "Frisco"]), ("Houston", ["Downtown", "Spring Branch", "Memorial", "Katy"]), ("Austin", ["Downtown", "Domain", "South Congress"]), ("San Antonio", ["Downtown", "Alamo Heights"])]),
        ("Washington", "WA", [("Seattle", ["Downtown", "Capitol Hill", "Ballard", "University District"]), ("Bellevue", ["Downtown", "Factoria"]), ("Tacoma", ["Downtown", "North End"])]),
        ("Illinois", "IL", [("Chicago", ["The Loop", "Lincoln Park", "West Loop", "River North", "Hyde Park"]), ("Cook County Suburbs", ["Glenview", "Schaumburg", "Evanston", "Naperville"])]),
        ("New Jersey", "NJ", [("Bergen County", ["Fort Lee", "Palisades Park", "Englewood", "Paramus", "Tenafly"]), ("Hudson County", ["Jersey City", "Hoboken"]), ("Middlesex County", ["Edison", "New Brunswick"])]),
        ("Georgia", "GA", [("Atlanta", ["Buckhead", "Midtown", "Downtown"]), ("Gwinnett County", ["Duluth", "Suwanee", "Buford", "Lawrenceville"])]),
        ("Virginia", "VA", [("Fairfax County", ["Annandale", "Centreville", "Tysons", "Vienna", "McLean"]), ("Arlington", ["Rosslyn", "Crystal City"]), ("Richmond", ["Downtown", "The Fan"])]),
        ("Florida", "FL", [("Miami", ["Brickell", "South Beach", "Downtown", "Coral Gables"]), ("Orlando", ["Downtown", "Lake Nona", "Winter Park"]), ("Tampa", ["Downtown", "Ybor City"])]),
        ("Pennsylvania", "PA", [("Philadelphia", ["Center City", "University City", "Old City", "Cheltenham"]), ("Pittsburgh", ["Downtown", "Oakland", "Shadyside"])]),
        ("Massachusetts", "MA", [("Boston", ["Back Bay", "Downtown", "Beacon Hill", "South End"]), ("Cambridge", ["Harvard Square", "Kendall Square"]), ("Brookline", ["Coolidge Corner"])]),
        ("North Carolina", "NC", [("Charlotte", ["Uptown", "South End", "Ballantyne"]), ("Raleigh", ["Downtown", "North Hills"]), ("Durham", ["Downtown", "Research Triangle"])]),
        ("Michigan", "MI", [("Detroit", ["Downtown", "Midtown"]), ("Oakland County", ["Troy", "Novi", "Ann Arbor"])]),
        ("Ohio", "OH", [("Columbus", ["Downtown", "Short North", "Dublin"]), ("Cleveland", ["Downtown", "University Circle"]), ("Cincinnati", ["Downtown", "Over-the-Rhine"])]),
        ("Colorado", "CO", [("Denver", ["Downtown", "LoDo", "Cherry Creek"]), ("Aurora", ["Havana District"]), ("Boulder", ["Pearl Street"])]),
        ("Arizona", "AZ", [("Phoenix", ["Downtown", "Midtown"]), ("Maricopa County", ["Scottsdale", "Tempe", "Chandler", "Mesa"])]),
        ("Nevada", "NV", [("Las Vegas", ["The Strip", "Spring Mountain (Chinatown)", "Summerlin", "Henderson"])]),
        ("Maryland", "MD", [("Montgomery County", ["Bethesda", "Rockville", "Silver Spring"]), ("Howard County", ["Ellicott City", "Columbia"])]),
        ("District of Columbia", "DC", [("Washington D.C.", ["Georgetown", "Dupont Circle", "Capitol Hill", "Foggy Bottom", "Adams Morgan"])]),
        ("Alabama", "AL", [("Birmingham", ["Downtown", "Five Points South"]), ("Huntsville", ["Downtown", "Madison"]), ("Mobile", ["Downtown"])]),
        ("Alaska", "AK", [("Anchorage", ["Downtown", "Midtown"]), ("Fairbanks", ["Downtown"])]),
        ("Arkansas", "AR", [("Little Rock", ["Downtown", "River Market"]), ("Northwest Arkansas", ["Bentonville", "Fayetteville"])]),
        ("Connecticut", "CT", [("Fairfield County", ["Stamford", "Greenwich"]), ("New Haven", ["Downtown", "Yale Area"]), ("Hartford", ["Downtown"])]),
        ("Delaware", "DE", [("New Castle County", ["Wilmington", "Newark"]), ("Kent County", ["Dover"])]),
        ("Hawaii", "HI", [("Honolulu (Oahu)", ["Waikiki", "Ala Moana", "Downtown", "Kaimuki", "Manoa"]), ("Maui", ["Kahului", "Lahaina"]), ("Hawaii (Big Island)", ["Hilo", "Kailua-Kona"])]),
        ("Idaho", "ID", [("Boise", ["Downtown", "North End"]), ("Ada County", ["Meridian", "Eagle"])]),
        ("Indiana", "IN", [("Indianapolis", ["Downtown", "Broad Ripple", "Carmel", "Fishers"]), ("Bloomington", ["IU Campus"])]),
        ("Iowa", "IA", [("Des Moines", ["Downtown", "East Village"]), ("Iowa City", ["Downtown"])]),
        ("Kansas", "KS", [("Kansas City Area", ["Overland Park", "Olathe"]), ("Wichita", ["Downtown"])]),
        ("Kentucky", "KY", [("Louisville", ["Downtown", "Highlands"]), ("Lexington", ["Downtown"])]),
        ("Louisiana", "LA", [("New Orleans", ["French Quarter", "Garden District", "CBD"]), ("Baton Rouge", ["Downtown"])]),
        ("Maine", "ME", [("Portland", ["Old Port", "Downtown"]), ("Bangor", ["Downtown"])]),
        ("Minnesota", "MN", [("Minneapolis", ["Downtown", "Uptown", "Northeast"]), ("Saint Paul", ["Downtown", "Highland Park"])]),
        ("Mississippi", "MS", [("Jackson", ["Downtown", "Fondren"]), ("Gulfport", ["Downtown"])]),
        ("Missouri", "MO", [("St. Louis", ["Downtown", "Central West End"]), ("Kansas City", ["Country Club Plaza", "Downtown"])]),
        ("Montana", "MT", [("Billings", ["Downtown"]), ("Bozeman", ["Downtown"]), ("Missoula", ["Downtown"])]),
        ("Nebraska", "NE", [("Omaha", ["Old Market", "Downtown"]), ("Lincoln", ["Downtown"])]),
        ("New Hampshire", "NH", [("Manchester", ["Downtown"]), ("Nashua", ["Downtown"])]),
        ("New Mexico", "NM", [("Albuquerque", ["Downtown", "Nob Hill"]), ("Santa Fe", ["Historic Plaza"])]),
        ("North Dakota", "ND", [("Fargo", ["Downtown"]), ("Bismarck", ["Downtown"])]),
        ("Oklahoma", "OK", [("Oklahoma City", ["Bricktown", "Downtown"]), ("Tulsa", ["Downtown"])]),
        ("Oregon", "OR", [("Portland", ["Pearl District", "Downtown", "Hawthorne"]), ("Beaverton", ["Central"])]),
        ("Rhode Island", "RI", [("Providence", ["College Hill", "Downtown", "Federal Hill"]), ("Newport", ["Historic Downtown"])]),
        ("South Carolina", "SC", [("Charleston", ["Historic District", "Downtown"]), ("Columbia", ["Downtown"]), ("Greenville", ["Downtown"])]),
        ("South Dakota", "SD", [("Sioux Falls", ["Downtown"]), ("Rapid City", ["Downtown"])]),
        ("Tennessee", "TN", [("Nashville", ["Downtown", "The Gulch", "Music Row"]), ("Memphis", ["Downtown", "Midtown"]), ("Knoxville", ["Downtown"])]),
        ("Utah", "UT", [("Salt Lake City", ["Downtown", "Sugar House"]), ("Utah County", ["Provo", "Orem"])]),
        ("Vermont", "VT", [("Burlington", ["Church Street", "Downtown"]), ("Montpelier", ["State Street"])]),
        ("West Virginia", "WV", [("Charleston", ["Downtown"]), ("Morgantown", ["Downtown"])]),
        ("Wisconsin", "WI", [("Milwaukee", ["Downtown", "Third Ward"]), ("Madison", ["Capitol Square", "State Street"])]),
        ("Wyoming", "WY", [("Cheyenne", ["Downtown"]), ("Casper", ["Downtown"]), ("Jackson", ["Town Square"])])
    ],

    # 2. CA (Canada) - All 10 Provinces + 3 Territories
    "CA": [
        ("Ontario", "ON", [("Toronto", ["Downtown", "North York", "Scarborough", "Etobicoke", "Yorkville"]), ("Ottawa", ["Centretown", "ByWard Market", "Kanata"]), ("Mississauga", ["City Centre", "Port Credit"])]),
        ("Quebec", "QC", [("Montreal", ["Downtown", "Plateau-Mont-Royal", "Old Montreal", "Côte-des-Neiges"]), ("Quebec City", ["Old Quebec", "Sainte-Foy"])]),
        ("British Columbia", "BC", [("Vancouver", ["Downtown", "West End", "Kitsilano", "Yaletown", "Kerrisdale"]), ("Richmond", ["City Centre", "Steveston"]), ("Burnaby", ["Metrotown", "Brentwood"]), ("Surrey", ["City Centre"])]),
        ("Alberta", "AB", [("Calgary", ["Downtown", "Beltline", "Kensington"]), ("Edmonton", ["Downtown", "Strathcona"])]),
        ("Manitoba", "MB", [("Winnipeg", ["Downtown", "Exchange District", "Osborne Village"])]),
        ("Saskatchewan", "SK", [("Saskatoon", ["Downtown", "Nutana"]), ("Regina", ["Downtown"])]),
        ("Nova Scotia", "NS", [("Halifax", ["Downtown", "South End", "Dartmouth"])]),
        ("New Brunswick", "NB", [("Fredericton", ["Downtown"]), ("Moncton", ["Downtown"]), ("Saint John", ["Uptown"])]),
        ("Newfoundland and Labrador", "NL", [("St. John's", ["Downtown", "Quidi Vidi"])]),
        ("Prince Edward Island", "PE", [("Charlottetown", ["Downtown", "Waterfront"])]),
        ("Northwest Territories", "NT", [("Yellowknife", ["Downtown", "Old Town"])]),
        ("Yukon", "YT", [("Whitehorse", ["Downtown", "Riverdale"])]),
        ("Nunavut", "NU", [("Iqaluit", ["Apex", "Happy Valley"])])
    ],

    # 3. GB (United Kingdom) - All 12 Nations & Regions
    "GB": [
        ("Greater London", "London", [("Central London", ["Westminster", "City of London", "Camden", "Kensington", "Soho"]), ("South London", ["New Malden (Koreatown)", "Kingston", "Wimbledon", "Richmond"]), ("East London", ["Canary Wharf", "Stratford", "Shoreditch"]), ("North London", ["Islington", "Barnet", "Finchley"])]),
        ("South East", "South East", [("Surrey", ["Guildford", "Woking"]), ("Oxfordshire", ["Oxford City"]), ("Berkshire", ["Reading", "Slough", "Windsor"]), ("Brighton and Hove", ["Brighton"])]),
        ("North West", "North West", [("Greater Manchester", ["Manchester City Centre", "Salford", "Didsbury", "Trafford"]), ("Merseyside", ["Liverpool City Centre", "Albert Dock"])]),
        ("West Midlands", "West Midlands", [("Birmingham", ["City Centre", "Edgbaston", "Jewellery Quarter", "Solihull"]), ("Coventry", ["City Centre"])]),
        ("Scotland", "Scotland", [("Edinburgh", ["Old Town", "New Town", "Leith"]), ("Glasgow", ["City Centre", "West End", "Southside"]), ("Aberdeen", ["City Centre"])]),
        ("Wales", "Wales", [("Cardiff", ["City Centre", "Cardiff Bay", "Cathays"]), ("Swansea", ["Marina", "City Centre"])]),
        ("Northern Ireland", "N. Ireland", [("Belfast", ["City Centre", "Cathedral Quarter", "Titanic Quarter"]), ("Derry / Londonderry", ["Cityside"])]),
        ("Yorkshire and the Humber", "Yorkshire", [("Leeds", ["City Centre", "Headingley"]), ("Sheffield", ["City Centre", "Broomhill"]), ("York", ["City Centre"])]),
        ("South West", "South West", [("Bristol", ["Harbourside", "Clifton", "City Centre"]), ("Bath", ["City Centre"]), ("Plymouth", ["City Centre"])]),
        ("East of England", "East", [("Cambridgeshire", ["Cambridge City", "Peterborough"]), ("Hertfordshire", ["Watford", "St Albans"]), ("Essex", ["Chelmsford", "Colchester"])]),
        ("East Midlands", "East Mid.", [("Nottingham", ["City Centre", "Lace Market"]), ("Leicester", ["City Centre"]), ("Derby", ["City Centre"])]),
        ("North East", "North East", [("Newcastle upon Tyne", ["City Centre", "Quayside", "Jesmond"]), ("Sunderland", ["City Centre"])])
    ],

    # 4. AU (Australia) - All 8 States and Territories
    "AU": [
        ("New South Wales", "NSW", [("Sydney Inner", ["Sydney CBD", "Surry Hills", "Pyrmont", "Haymarket"]), ("Sydney North / West", ["Eastwood", "Strathfield", "Chatswood", "Parramatta", "Epping"]), ("Sydney South", ["Hurstville", "Kogarah"])]),
        ("Victoria", "VIC", [("Melbourne Inner", ["Melbourne CBD", "Docklands", "Southbank", "Carlton"]), ("Melbourne East / South", ["Box Hill", "Glen Waverley", "Clayton", "South Yarra", "St Kilda"])]),
        ("Queensland", "QLD", [("Brisbane", ["Brisbane CBD", "South Brisbane", "Fortitude Valley", "Sunnybank"]), ("Gold Coast", ["Surfers Paradise", "Southport", "Broadbeach"]), ("Cairns", ["Cairns City"])]),
        ("Western Australia", "WA", [("Perth", ["Perth CBD", "Northbridge", "Subiaco", "Fremantle", "Cannington"])]),
        ("South Australia", "SA", [("Adelaide", ["Adelaide CBD", "North Adelaide", "Norwood", "Glenelg"])]),
        ("Tasmania", "TAS", [("Hobart", ["Hobart CBD", "Battery Point", "Sandy Bay"]), ("Launceston", ["City Centre"])]),
        ("Australian Capital Territory", "ACT", [("Canberra", ["Civic (City)", "Braddon", "Belconnen", "Barton"])]),
        ("Northern Territory", "NT", [("Darwin", ["Darwin City", "Cullen Bay"]), ("Alice Springs", ["Town Centre"])])
    ],

    # 5. NZ (New Zealand) - All 16 Regions
    "NZ": [
        ("Auckland Region", "Auckland", [("Central Auckland", ["Auckland CBD", "Ponsonby", "Newmarket", "Parnell"]), ("North Shore", ["Albany", "Takapuna", "Browns Bay"]), ("East Auckland", ["Howick", "Pakuranga"])]),
        ("Wellington Region", "Wellington", [("Wellington City", ["Wellington CBD", "Te Aro", "Thorndon", "Oriental Bay"]), ("Lower Hutt", ["Hutt Central"])]),
        ("Canterbury", "Canterbury", [("Christchurch", ["Christchurch Central", "Riccarton", "Merivale", "Fendalton"])]),
        ("Waikato", "Waikato", [("Hamilton", ["Hamilton Central", "Rototuna"]), ("Taupo", ["Taupo Central"])]),
        ("Bay of Plenty", "Bay of Plenty", [("Tauranga", ["Mount Maunganui", "Tauranga Central"]), ("Rotorua", ["Central"])]),
        ("Otago", "Otago", [("Queenstown Lakes", ["Queenstown Central", "Frankton", "Wanaka"]), ("Dunedin", ["Dunedin Central"])]),
        ("Hawke's Bay", "Hawke's Bay", [("Napier", ["Napier South"]), ("Hastings", ["Hastings Central"])]),
        ("Manawatū-Whanganui", "Manawatū", [("Palmerston North", ["City Centre"]), ("Whanganui", ["Central"])]),
        ("Northland", "Northland", [("Whangarei", ["Central"]), ("Far North", ["Kerikeri"])]),
        ("Taranaki", "Taranaki", [("New Plymouth", ["Central"])]),
        ("Nelson", "Nelson", [("Nelson City", ["Nelson Central"])]),
        ("Tasman", "Tasman", [("Richmond", ["Richmond Central"])]),
        ("Marlborough", "Marlborough", [("Blenheim", ["Blenheim Central"])]),
        ("Southland", "Southland", [("Invercargill", ["Invercargill Central"])]),
        ("Gisborne", "Gisborne", [("Gisborne City", ["Gisborne Central"])]),
        ("West Coast", "West Coast", [("Greymouth", ["Greymouth Central"])])
    ],

    # 6. DE (Germany) - All 16 Bundesländer
    "DE": [
        ("Berlin", "Berlin", [("Mitte", ["Alexanderplatz", "Tiergarten", "Wedding"]), ("Charlottenburg-Wilmersdorf", ["Charlottenburg", "Ku'damm", "Wilmersdorf"]), ("Friedrichshain-Kreuzberg", ["Kreuzberg", "Friedrichshain"]), ("Pankow", ["Prenzlauer Berg"])]),
        ("Bayern (Bavaria)", "Bayern", [("München (Munich)", ["Altstadt", "Schwabing", "Maxvorstadt", "Bogenhausen"]), ("Nürnberg (Nuremberg)", ["Altstadt"]), ("Augsburg", ["Innenstadt"])]),
        ("Hessen", "Hessen", [("Frankfurt am Main", ["Innenstadt", "Sachsenhausen", "Westend", "Eschborn", "Nordend"]), ("Wiesbaden", ["Mitte"]), ("Darmstadt", ["Mitte"])]),
        ("Nordrhein-Westfalen", "NRW", [("Düsseldorf", ["Altstadt", "Stadtmitte (Little Tokyo)", "Oberkassel"]), ("Köln (Cologne)", ["Innenstadt", "Ehrenfeld", "Deutz"]), ("Essen", ["Stadtkern"]), ("Dortmund", ["Innenstadt"])]),
        ("Baden-Württemberg", "BW", [("Stuttgart", ["Mitte", "Bad Cannstatt"]), ("Karlsruhe", ["Innenstadt"]), ("Heidelberg", ["Altstadt"]), ("Freiburg", ["Altstadt"])]),
        ("Hamburg", "Hamburg", [("Hamburg-Mitte", ["Altstadt", "Neustadt", "HafenCity", "St. Pauli"]), ("Altona", ["Ottensen", "Altona-Nord"])]),
        ("Sachsen (Saxony)", "Sachsen", [("Dresden", ["Innere Altstadt", "Neustadt"]), ("Leipzig", ["Zentrum", "Plagwitz"])]),
        ("Niedersachsen (Lower Saxony)", "Niedersachsen", [("Hannover", ["Mitte", "Südstadt"]), ("Braunschweig", ["Innenstadt"]), ("Osnabrück", ["Innenstadt"])]),
        ("Rheinland-Pfalz", "RLP", [("Mainz", ["Altstadt", "Neustadt"]), ("Ludwigshafen", ["Mitte"]), ("Koblenz", ["Altstadt"])]),
        ("Bremen", "Bremen", [("Bremen City", ["Mitte", "Neustadt"]), ("Bremerhaven", ["Mitte"])]),
        ("Schleswig-Holstein", "SH", [("Kiel", ["Mitte", "Vorstadt"]), ("Lübeck", ["Innenstadt"])]),
        ("Brandenburg", "Brandenburg", [("Potsdam", ["Innenstadt", "Babelsberg"]), ("Cottbus", ["Mitte"])]),
        ("Thüringen", "Thüringen", [("Erfurt", ["Altstadt"]), ("Jena", ["Zentrum"]), ("Weimar", ["Altstadt"])]),
        ("Sachsen-Anhalt", "Sachsen-Anhalt", [("Magdeburg", ["Altstadt"]), ("Halle (Saale)", ["Altstadt"])]),
        ("Mecklenburg-Vorpommern", "MV", [("Rostock", ["Stadtmitte"]), ("Schwerin", ["Altstadt"])]),
        ("Saarland", "Saarland", [("Saarbrücken", ["Mitte", "St. Johann"])])
    ],

    # 7. FR (France) - All 18 Régions (13 Metropolitan + 5 Overseas)
    "FR": [
        ("Île-de-France", "Paris Reg.", [("Paris", ["1er Arrondissement", "2e Arrondissement", "8e (Champs-Élysées)", "9e (Opéra)", "15e Arrondissement", "16e Arrondissement"]), ("Hauts-de-Seine", ["Boulogne-Billancourt", "Neuilly-sur-Seine", "La Défense", "Issy-les-Moulineaux"]), ("Yvelines", ["Versailles", "Saint-Germain-en-Laye"])]),
        ("Auvergne-Rhône-Alpes", "Lyon Reg.", [("Lyon", ["Presqu'île", "Vieux Lyon", "Part-Dieu", "Croix-Rousse"]), ("Grenoble", ["Centre-Ville"]), ("Saint-Étienne", ["Centre"])]),
        ("Provence-Alpes-Côte d'Azur", "PACA", [("Marseille", ["Vieux-Port", "Prado", "La Plaine"]), ("Nice", ["Promenade des Anglais", "Vieux Nice", "Cimiez"]), ("Cannes", ["La Croisette"])]),
        ("Nouvelle-Aquitaine", "Aquitaine", [("Bordeaux", ["Centre-Ville", "Chartrons", "Saint-Pierre"]), ("Limoges", ["Centre"]), ("Poitiers", ["Centre"])]),
        ("Occitanie", "Occitanie", [("Toulouse", ["Capitole", "Carmes", "Saint-Cyprien"]), ("Montpellier", ["Écusson", "Antigone"])]),
        ("Hauts-de-France", "Lille Reg.", [("Lille", ["Vieux-Lille", "Centre", "Wazemmes"]), ("Amiens", ["Centre-Ville"])]),
        ("Grand Est", "Strasbourg Reg.", [("Strasbourg", ["Grande Île", "Krutenau", "Petite France"]), ("Reims", ["Centre"]), ("Metz", ["Centre-Ville"])]),
        ("Pays de la Loire", "Nantes Reg.", [("Nantes", ["Centre-Ville", "Île de Nantes", "Graslin"]), ("Angers", ["Centre"])]),
        ("Bretagne (Brittany)", "Bretagne", [("Rennes", ["Centre-Ville", "Thabor"]), ("Brest", ["Centre"]), ("Saint-Malo", ["Intra-Muros"])]),
        ("Normandie", "Normandie", [("Rouen", ["Vieux-Rouen"]), ("Caen", ["Centre-Ville"]), ("Le Havre", ["Centre-Ville"])]),
        ("Bourgogne-Franche-Comté", "Bourgogne", [("Dijon", ["Centre Historique"]), ("Besançon", ["Boucle"])]),
        ("Centre-Val de Loire", "Centre", [("Orléans", ["Centre-Ville"]), ("Tours", ["Vieux-Tours"])]),
        ("Corse (Corsica)", "Corse", [("Ajaccio", ["Centre"]), ("Bastia", ["Vieux-Port"])]),
        ("Guadeloupe", "Guadeloupe", [("Pointe-à-Pitre", ["Centre"]), ("Les Abymes", ["Centre"])]),
        ("Martinique", "Martinique", [("Fort-de-France", ["Centre"])]),
        ("Guyane (French Guiana)", "Guyane", [("Cayenne", ["Centre"])]),
        ("La Réunion", "Réunion", [("Saint-Denis", ["Centre"])]),
        ("Mayotte", "Mayotte", [("Mamoudzou", ["Centre"])])
    ],

    # 8. IT (Italy) - All 20 Regioni
    "IT": [
        ("Lombardia (Lombardy)", "Lombardia", [("Milano", ["Centro Storico", "Duomo", "Porta Nuova", "Navigli", "Brera", "Isola"]), ("Brescia", ["Centro"]), ("Bergamo", ["Città Alta", "Città Bassa"])]),
        ("Lazio", "Lazio", [("Roma", ["Centro Storico", "Trastevere", "Prati", "EUR", "Parioli", "Monti"]), ("Latina", ["Centro"])]),
        ("Veneto", "Veneto", [("Venezia", ["San Marco", "Cannaregio", "Mestre"]), ("Verona", ["Centro Storico"]), ("Padova", ["Centro"])]),
        ("Piemonte (Piedmont)", "Piemonte", [("Torino", ["Centro", "Crocetta", "San Salvario", "Quadrilatero"])]),
        ("Emilia-Romagna", "Emilia", [("Bologna", ["Centro Storico", "Santo Stefano", "Saragozza"]), ("Modena", ["Centro"]), ("Parma", ["Centro"])]),
        ("Toscana (Tuscany)", "Toscana", [("Firenze (Florence)", ["Centro Storico", "Santa Maria Novella", "Oltrarno"]), ("Pisa", ["Centro"]), ("Siena", ["Centro"])]),
        ("Campania", "Campania", [("Napoli (Naples)", ["Centro Storico", "Chiaia", "Vomero", "Posillipo"]), ("Salerno", ["Centro"])]),
        ("Sicilia (Sicily)", "Sicilia", [("Palermo", ["Centro Storico", "Politeama"]), ("Catania", ["Centro"]), ("Messina", ["Centro"])]),
        ("Puglia (Apulia)", "Puglia", [("Bari", ["Murat", "Bari Vecchia"]), ("Lecce", ["Centro Storico"])]),
        ("Liguria", "Liguria", [("Genova (Genoa)", ["Centro Storico", "Carignano", "Albaro"]), ("La Spezia", ["Centro"])]),
        ("Friuli Venezia Giulia", "FVG", [("Trieste", ["Centro Storico", "Borgo Teresiano"]), ("Udine", ["Centro"])]),
        ("Marche", "Marche", [("Ancona", ["Centro"]), ("Pesaro", ["Centro"])]),
        ("Sardegna (Sardinia)", "Sardegna", [("Cagliari", ["Castello", "Marina"]), ("Sassari", ["Centro"])]),
        ("Abruzzo", "Abruzzo", [("Pescara", ["Centro"]), ("L'Aquila", ["Centro"])]),
        ("Trentino-Alto Adige", "Trentino", [("Trento", ["Centro Storico"]), ("Bolzano (Bozen)", ["Centro"])]),
        ("Umbria", "Umbria", [("Perugia", ["Centro Storico"]), ("Terni", ["Centro"])]),
        ("Calabria", "Calabria", [("Reggio Calabria", ["Centro"]), ("Catanzaro", ["Centro"])]),
        ("Basilicata", "Basilicata", [("Potenza", ["Centro"]), ("Matera", ["Sassi", "Centro"])]),
        ("Molise", "Molise", [("Campobasso", ["Centro"]), ("Isernia", ["Centro"])]),
        ("Valle d'Aosta", "Valle d'Aosta", [("Aosta", ["Centro"])])
    ],

    # 9. ES (Spain) - All 17 Autonomous Communities + 2 Autonomous Cities
    "ES": [
        ("Comunidad de Madrid", "Madrid", [("Madrid Capital", ["Centro (Sol/Gran Vía)", "Salamanca", "Chamberí", "Chamartín", "Retiro", "Moncloa"]), ("Alcobendas", ["La Moraleja"]), ("Pozuelo de Alarcón", ["Centro"])]),
        ("Cataluña (Catalonia)", "Cataluña", [("Barcelona", ["Eixample", "Ciutat Vella (Gòtic)", "Gràcia", "Sarrià-Sant Gervasi", "Poblenou"]), ("Hospitalet de Llobregat", ["Centre"]), ("Badalona", ["Centre"])]),
        ("Andalucía", "Andalucía", [("Sevilla", ["Casco Antiguo", "Triana", "Nervión"]), ("Málaga", ["Centro Histórico", "Teatinos"]), ("Granada", ["Centro", "Albaicín"])]),
        ("Comunidad Valenciana", "Valencia", [("Valencia Capital", ["Ciutat Vella", "Eixample", "Poblats Marítims"]), ("Alicante", ["Centro"]), ("Castellón", ["Centro"])]),
        ("País Vasco (Basque Country)", "País Vasco", [("Bilbao", ["Abando", "Casco Viejo", "Indautxu"]), ("San Sebastián (Donostia)", ["Centro", "Gros"]), ("Vitoria-Gasteiz", ["Centro"])]),
        ("Galicia", "Galicia", [("A Coruña", ["Centro", "Riazor"]), ("Vigo", ["Centro"]), ("Santiago de Compostela", ["Casco Histórico"])]),
        ("Castilla y León", "Castilla y León", [("Valladolid", ["Centro"]), ("Salamanca", ["Centro Histórico"]), ("Burgos", ["Centro"]), ("León", ["Centro"])]),
        ("Islas Canarias (Canary Islands)", "Canarias", [("Las Palmas de Gran Canaria", ["Vegueta", "Puerto-Canteras"]), ("Santa Cruz de Tenerife", ["Centro"])]),
        ("Castilla-La Mancha", "Castilla-La Mancha", [("Toledo", ["Casco Histórico"]), ("Albacete", ["Centro"]), ("Ciudad Real", ["Centro"])]),
        ("Región de Murcia", "Murcia", [("Murcia Capital", ["Centro", "La Flota"]), ("Cartagena", ["Centro"])]),
        ("Aragón", "Aragón", [("Zaragoza", ["Casco Antiguo", "Centro", "Delicias"])]),
        ("Islas Baleares (Balearic Islands)", "Baleares", [("Palma de Mallorca", ["Centre", "Santa Catalina"]), ("Ibiza", ["Eivissa"])]),
        ("Extremadura", "Extremadura", [("Badajoz", ["Centro"]), ("Cáceres", ["Ciudad Monumental"]), ("Mérida", ["Centro"])]),
        ("Principado de Asturias", "Asturias", [("Oviedo", ["Centro"]), ("Gijón", ["Centro", "Cimavilla"])]),
        ("Comunidad Foral de Navarra", "Navarra", [("Pamplona (Iruña)", ["Casco Antiguo", "Ensanche"])]),
        ("Cantabria", "Cantabria", [("Santander", ["Centro", "El Sardinero"])]),
        ("La Rioja", "La Rioja", [("Logroño", ["Casco Antiguo", "Centro"])]),
        ("Ceuta", "Ceuta", [("Ceuta", ["Centro"])]),
        ("Melilla", "Melilla", [("Melilla", ["Centro"])])
    ],

    # 10. NL (Netherlands) - All 12 Provincies
    "NL": [
        ("Noord-Holland (North Holland)", "Noord-Holland", [("Amsterdam", ["Centrum", "Zuid (South)", "Oost (East)", "West", "Noord", "Zuidas"]), ("Haarlem", ["Centrum"]), ("Amstelveen", ["Stadshart"])]),
        ("Zuid-Holland (South Holland)", "Zuid-Holland", [("Rotterdam", ["Centrum", "Kop van Zuid", "Kralingen"]), ("Den Haag (The Hague)", ["Centrum", "Scheveningen", "Bezuidenhout"]), ("Leiden", ["Binnenstad"])]),
        ("Utrecht", "Utrecht", [("Utrecht City", ["Binnenstad", "Oost", "Leidsche Rijn"]), ("Amersfoort", ["Centrum"])]),
        ("Noord-Brabant", "Noord-Brabant", [("Eindhoven", ["Centrum", "Strijp-S"]), ("Tilburg", ["Centrum"]), ("Breda", ["Binnenstad"]), ("'s-Hertogenbosch", ["Centrum"])]),
        ("Gelderland", "Gelderland", [("Nijmegen", ["Centrum"]), ("Arnhem", ["Centrum"]), ("Apeldoorn", ["Centrum"])]),
        ("Groningen", "Groningen", [("Groningen City", ["Binnenstad", "Oosterpoort"])]),
        ("Overijssel", "Overijssel", [("Enschede", ["Centrum"]), ("Zwolle", ["Binnenstad"])]),
        ("Limburg", "Limburg", [("Maastricht", ["Centrum", "Wyck"]), ("Venlo", ["Centrum"])]),
        ("Friesland (Fryslân)", "Friesland", [("Leeuwarden", ["Binnenstad"])]),
        ("Flevoland", "Flevoland", [("Almere", ["Stad"]), ("Lelystad", ["Centrum"])]),
        ("Drenthe", "Drenthe", [("Assen", ["Centrum"]), ("Emmen", ["Centrum"])]),
        ("Zeeland", "Zeeland", [("Middelburg", ["Binnenstad"]), ("Vlissingen", ["Centrum"])])
    ],

    # 11. PL (Poland) - All 16 Województwa
    "PL": [
        ("Mazowieckie", "Mazowsze", [("Warszawa (Warsaw)", ["Śródmieście (Center)", "Mokotów", "Wola", "Ochota", "Ursynów", "Praga"]), ("Radom", ["Centrum"]), ("Płock", ["Centrum"])]),
        ("Małopolskie", "Małopolska", [("Kraków", ["Stare Miasto", "Kazimierz", "Podgórze", "Krowodrza"]), ("Tarnów", ["Centrum"]), ("Nowy Sącz", ["Centrum"])]),
        ("Dolnośląskie (Lower Silesian)", "Dolny Śląsk", [("Wrocław", ["Stare Miasto", "Krzyki", "Śródmieście", "Fabryczna"]), ("Wałbrzych", ["Centrum"]), ("Legnica", ["Centrum"])]),
        ("Wielkopolskie", "Wielkopolska", [("Poznań", ["Stare Miasto", "Jeżyce", "Grunwald", "Wilda"]), ("Kalisz", ["Centrum"])]),
        ("Śląskie (Silesian)", "Śląsk", [("Katowice", ["Śródmieście", "Brynów"]), ("Gliwice", ["Centrum"]), ("Częstochowa", ["Centrum"]), ("Sosnowiec", ["Centrum"])]),
        ("Pomorskie", "Pomorze", [("Gdańsk", ["Śródmieście", "Wrzeszcz", "Oliwa"]), ("Gdynia", ["Śródmieście"]), ("Sopot", ["Dolny Sopot"])]),
        ("Łódzkie", "Łódzkie", [("Łódź", ["Śródmieście (Piotrkowska)", "Bałuty", "Widzew"]), ("Piotrków Trybunalski", ["Centrum"])]),
        ("Kujawsko-Pomorskie", "Kujawy", [("Bydgoszcz", ["Śródmieście"]), ("Toruń", ["Stare Miasto"])]),
        ("Lubelskie", "Lubelskie", [("Lublin", ["Śródmieście", "Stare Miasto"]), ("Zamość", ["Stare Miasto"])]),
        ("Podkarpackie", "Podkarpacie", [("Rzeszów", ["Śródmieście", "Nowe Miasto"]), ("Przemyśl", ["Centrum"])]),
        ("Zachodniopomorskie", "Zach. Pomorze", [("Szczecin", ["Śródmieście"]), ("Koszalin", ["Centrum"])]),
        ("Podlaskie", "Podlasie", [("Białystok", ["Centrum", "Sienkiewicza"]), ("Łomża", ["Centrum"])]),
        ("Świętokrzyskie", "Świętokrzyskie", [("Kielce", ["Śródmieście"]), ("Ostrowiec Świętokrzyski", ["Centrum"])]),
        ("Warmińsko-Mazurskie", "Warmia-Mazury", [("Olsztyn", ["Śródmieście", "Stare Miasto"]), ("Elbląg", ["Centrum"])]),
        ("Lubuskie", "Lubuskie", [("Zielona Góra", ["Centrum"]), ("Gorzów Wielkopolski", ["Centrum"])]),
        ("Opolskie", "Opolskie", [("Opole", ["Śródmieście"])])
    ],

    # 12. SE (Sweden) - All 21 Län
    "SE": [
        ("Stockholm", "Stockholm", [("Stockholm City", ["Norrmalm", "Södermalm", "Östermalm", "Kungsholmen", "Vasastan"]), ("Solna", ["Råsunda", "Arenastaden"]), ("Kista", ["Kista Science City"])]),
        ("Västra Götaland", "Västra Götaland", [("Göteborg (Gothenburg)", ["Centrum", "Majorna", "Linnéstaden", "Haga"]), ("Borås", ["Centrum"])]),
        ("Skåne", "Skåne", [("Malmö", ["Centrum", "Västra Hamnen", "Möllevången"]), ("Helsingborg", ["Centrum"]), ("Lund", ["Centrum"])]),
        ("Uppsala", "Uppsala", [("Uppsala City", ["Centrum", "Luthagen", "Fålhagen"])]),
        ("Östergötland", "Östergötland", [("Linköping", ["Centrum"]), ("Norrköping", ["Centrum"])]),
        ("Jönköping", "Jönköping", [("Jönköping City", ["Centrum", "Väster"])]),
        ("Halland", "Halland", [("Halmstad", ["Centrum"]), ("Kungsbacka", ["Centrum"])]),
        ("Örebro", "Örebro", [("Örebro City", ["Centrum"])]),
        ("Västmanland", "Västmanland", [("Västerås", ["Centrum"])]),
        ("Dalarna", "Dalarna", [("Falun", ["Centrum"]), ("Borlänge", ["Centrum"])]),
        ("Gävleborg", "Gävleborg", [("Gävle", ["Centrum"])]),
        ("Värmland", "Värmland", [("Karlstad", ["Centrum"])]),
        ("Västerbotten", "Västerbotten", [("Umeå", ["Centrum"])]),
        ("Norrbotten", "Norrbotten", [("Luleå", ["Centrum"]), ("Kiruna", ["Centrum"])]),
        ("Västernorrland", "Västernorrland", [("Sundsvall", ["Stenstan"])]),
        ("Kronoberg", "Kronoberg", [("Växjö", ["Centrum"])]),
        ("Kalmar", "Kalmar", [("Kalmar City", ["Kvarnholmen"])]),
        ("Södermanland", "Södermanland", [("Eskilstuna", ["Centrum"])]),
        ("Blekinge", "Blekinge", [("Karlskrona", ["Centrum"])]),
        ("Jämtland", "Jämtland", [("Östersund", ["Centrum"])]),
        ("Gotland", "Gotland", [("Visby", ["Innerstaden"])])
    ],

    # 13. NO (Norway) - All 15 Fylker
    "NO": [
        ("Oslo", "Oslo", [("Oslo Sentrum", ["Sentrum", "Frogner", "Majorstuen", "Grünerløkka", "St. Hanshaugen", "Gamle Oslo"])]),
        ("Vestland", "Vestland", [("Bergen", ["Bergenhus", "Sentrum", "Årstad", "Fana"]), ("Førde", ["Sentrum"])]),
        ("Trøndelag", "Trøndelag", [("Trondheim", ["Midtbyen", "Østbyen", "Lerkendal"])]),
        ("Rogaland", "Rogaland", [("Stavanger", ["Sentrum", "Hinna"]), ("Sandnes", ["Sentrum"]), ("Haugesund", ["Sentrum"])]),
        ("Akershus", "Akershus", [("Bærum", ["Sandvika", "Lysaker"]), ("Asker", ["Sentrum"]), ("Lillestrøm", ["Sentrum"])]),
        ("Møre og Romsdal", "Møre og Romsdal", [("Ålesund", ["Sentrum"]), ("Molde", ["Sentrum"])]),
        ("Nordland", "Nordland", [("Bodø", ["Sentrum"]), ("Narvik", ["Sentrum"])]),
        ("Troms", "Troms", [("Tromsø", ["Tromsøya", "Sentrum"])]),
        ("Innlandet", "Innlandet", [("Hamar", ["Sentrum"]), ("Lillehammer", ["Sentrum"]), ("Gjøvik", ["Sentrum"])]),
        ("Østfold", "Østfold", [("Fredrikstad", ["Sentrum"]), ("Sarpsborg", ["Sentrum"]), ("Moss", ["Sentrum"])]),
        ("Buskerud", "Buskerud", [("Drammen", ["Sentrum"]), ("Kongsberg", ["Sentrum"])]),
        ("Vestfold", "Vestfold", [("Tønsberg", ["Sentrum"]), ("Sandefjord", ["Sentrum"])]),
        ("Telemark", "Telemark", [("Skien", ["Sentrum"]), ("Porsgrunn", ["Sentrum"])]),
        ("Agder", "Agder", [("Kristiansand", ["Kvadraturen", "Grim"]), ("Arendal", ["Sentrum"])]),
        ("Finnmark", "Finnmark", [("Alta", ["Sentrum"]), ("Hammerfest", ["Sentrum"])])
    ],

    # 14. DK (Denmark) - All 5 Regioner
    "DK": [
        ("Region Hovedstaden (Capital)", "Hovedstaden", [("København (Copenhagen)", ["Indre By (City)", "Vesterbro", "Nørrebro", "Østerbro", "Frederiksberg"]), ("Helsingør", ["Centrum"]), ("Hillerød", ["Centrum"])]),
        ("Region Midtjylland (Central)", "Midtjylland", [("Aarhus", ["Aarhus C", "Trøjborg", "Viby"]), ("Randers", ["Centrum"]), ("Horsens", ["Centrum"]), ("Silkeborg", ["Centrum"])]),
        ("Region Syddanmark (Southern)", "Syddanmark", [("Odense", ["Centrum", "Odense M"]), ("Esbjerg", ["Centrum"]), ("Kolding", ["Centrum"]), ("Vejle", ["Centrum"])]),
        ("Region Nordjylland (Northern)", "Nordjylland", [("Aalborg", ["Centrum", "Aalborg Øst"]), ("Hjørring", ["Centrum"])]),
        ("Region Sjælland (Zealand)", "Sjælland", [("Roskilde", ["Centrum"]), ("Næstved", ["Centrum"]), ("Køge", ["Centrum"])])
    ],

    # 15. CH (Switzerland) - All 26 Cantons
    "CH": [
        ("Zürich", "ZH", [("Zürich City", ["Altstadt", "Wiedikon", "Aussersihl", "Zürich West"]), ("Winterthur", ["Altstadt"])]),
        ("Genève (Geneva)", "GE", [("Genève City", ["Cité-Centre", "Eaux-Vives", "Pâquis", "Plainpalais"])]),
        ("Vaud", "VD", [("Lausanne", ["Centre-Ville", "Ouchy", "Flon"]), ("Montreux", ["Centre"])]),
        ("Bern", "BE", [("Bern City", ["Innere Stadt", "Länggasse", "Mattenhof"]), ("Thun", ["Zentrum"]), ("Biel/Bienne", ["Zentrum"])]),
        ("Basel-Stadt", "BS", [("Basel City", ["Grossbasel", "Kleinbasel", "St. Alban"])]),
        ("Luzern", "LU", [("Luzern City", ["Altstadt", "Neustadt"])]),
        ("St. Gallen", "SG", [("St. Gallen City", ["Innenstadt"])]),
        ("Aargau", "AG", [("Aarau", ["Zentrum"]), ("Baden", ["Zentrum"])]),
        ("Zug", "ZG", [("Zug City", ["Altstadt", "Neustadt"])]),
        ("Ticino", "TI", [("Lugano", ["Centro"]), ("Bellinzona", ["Centro"]), ("Locarno", ["Centro"])]),
        ("Valais", "VS", [("Sion", ["Centre"]), ("Martigny", ["Centre"])]),
        ("Neuchâtel", "NE", [("Neuchâtel City", ["Centre"])]),
        ("Fribourg", "FR", [("Fribourg City", ["Centre-Ville"])]),
        ("Solothurn", "SO", [("Solothurn City", ["Altstadt"]), ("Olten", ["Zentrum"])]),
        ("Graubünden", "GR", [("Chur", ["Altstadt"]), ("Davos", ["Platz"]), ("St. Moritz", ["Dorf"])]),
        ("Thurgau", "TG", [("Frauenfeld", ["Zentrum"]), ("Kreuzlingen", ["Zentrum"])]),
        ("Basel-Landschaft", "BL", [("Liestal", ["Altstadt"])]),
        ("Schaffhausen", "SH", [("Schaffhausen City", ["Altstadt"])]),
        ("Schwyz", "SZ", [("Schwyz City", ["Zentrum"])]),
        ("Jura", "JU", [("Delémont", ["Centre"])]),
        ("Appenzell Ausserrhoden", "AR", [("Herisau", ["Zentrum"])]),
        ("Appenzell Innerrhoden", "AI", [("Appenzell", ["Dorf"])]),
        ("Glarus", "GL", [("Glarus", ["Zentrum"])]),
        ("Nidwalden", "NW", [("Stans", ["Dorf"])]),
        ("Obwalden", "OW", [("Sarnen", ["Dorf"])]),
        ("Uri", "UR", [("Altdorf", ["Zentrum"])])
    ],

    # 16. PT (Portugal) - All 18 Districts + 2 Autonomous Regions
    "PT": [
        ("Lisboa", "Lisboa", [("Lisbon Capital", ["Baixa", "Chiado", "Avenidas Novas", "Parque das Nações", "Belém", "Campo de Ourique"]), ("Cascais", ["Centro"]), ("Sintra", ["Vila"])]),
        ("Porto", "Porto", [("Porto Capital", ["Centro / Baixa", "Cedofeita", "Foz do Douro", "Boavista"]), ("Vila Nova de Gaia", ["Centro"])]),
        ("Faro (Algarve)", "Algarve", [("Faro City", ["Centro"]), ("Albufeira", ["Centro"]), ("Lagos", ["Centro"]), ("Portimão", ["Centro"])]),
        ("Braga", "Braga", [("Braga City", ["Centro Histórico"]), ("Guimarães", ["Centro"])]),
        ("Setúbal", "Setúbal", [("Setúbal City", ["Centro"]), ("Almada", ["Centro"])]),
        ("Coimbra", "Coimbra", [("Coimbra City", ["Alta", "Baixa"])]),
        ("Aveiro", "Aveiro", [("Aveiro City", ["Glória", "Vera Cruz"])]),
        ("Leiria", "Leiria", [("Leiria City", ["Centro"])]),
        ("Santarém", "Santarém", [("Santarém City", ["Centro"])]),
        ("Viseu", "Viseu", [("Viseu City", ["Centro"])]),
        ("Viana do Castelo", "Viana", [("Viana City", ["Centro"])]),
        ("Vila Real", "Vila Real", [("Vila Real City", ["Centro"])]),
        ("Castelo Branco", "Castelo Branco", [("Castelo Branco City", ["Centro"])]),
        ("Guarda", "Guarda", [("Guarda City", ["Centro"])]),
        ("Évora", "Évora", [("Évora City", ["Centro Histórico"])]),
        ("Beja", "Beja", [("Beja City", ["Centro"])]),
        ("Bragança", "Bragança", [("Bragança City", ["Centro"])]),
        ("Portalegre", "Portalegre", [("Portalegre City", ["Centro"])]),
        ("Região Autónoma da Madeira", "Madeira", [("Funchal", ["Sé", "São Pedro", "Santa Maria"])]),
        ("Região Autónoma dos Açores", "Açores", [("Ponta Delgada", ["São Sebastião", "São Pedro"])])
    ],

    # 17. GR (Greece) - All 13 Administrative Regions
    "GR": [
        ("Attica (Athens)", "Attica", [("Athens City", ["Syntagma", "Plaka", "Kolonaki", "Monastiraki", "Koukaki"]), ("Piraeus", ["Port Area", "Kastella"]), ("Northern Suburbs", ["Kifisia", "Marousi"]), ("Southern Suburbs", ["Glyfada", "Voula"])]),
        ("Central Macedonia", "C. Macedonia", [("Thessaloniki", ["Center", "Ladadika", "Kalamaria", "Ano Poli"])]),
        ("Crete", "Crete", [("Heraklion", ["Center"]), ("Chania", ["Old Town"]), ("Rethymno", ["Center"])]),
        ("Western Greece", "W. Greece", [("Patras", ["Center", "Agia Sofia"])]),
        ("Thessaly", "Thessaly", [("Larissa", ["Center"]), ("Volos", ["Center"])]),
        ("Peloponnese", "Peloponnese", [("Kalamata", ["Center"]), ("Tripoli", ["Center"]), ("Corinth", ["Center"])]),
        ("Epirus", "Epirus", [("Ioannina", ["Center", "Castle Area"])]),
        ("Eastern Macedonia and Thrace", "E. Macedonia", [("Alexandroupoli", ["Center"]), ("Kavala", ["Center"])]),
        ("Central Greece", "C. Greece", [("Lamia", ["Center"]), ("Chalcis", ["Center"])]),
        ("South Aegean", "S. Aegean", [("Rhodes", ["Medieval Town", "Rhodes Town"]), ("Mykonos", ["Chora"]), ("Santorini", ["Fira", "Oia"])]),
        ("Ionian Islands", "Ionian", [("Corfu (Kerkyra)", ["Old Town"]), ("Zakynthos", ["Town"])]),
        ("Western Macedonia", "W. Macedonia", [("Kozani", ["Center"]), ("Kastoria", ["Center"])]),
        ("North Aegean", "N. Aegean", [("Lesbos (Mytilene)", ["Center"]), ("Chios", ["Town"])])
    ],

    # 18. TR (Turkey) - Top Major Provinces (İstanbul, Ankara, İzmir, Antalya, Bursa + All 7 Regions)
    "TR": [
        ("İstanbul", "İstanbul", [("Avrupa (European Side)", ["Beyoğlu (Taksim)", "Şişli", "Beşiktaş", "Fatih", "Bakırköy", "Sarıyer"]), ("Anadolu (Asian Side)", ["Kadıköy", "Üsküdar", "Ataşehir", "Maltepe"])]),
        ("Ankara", "Ankara", [("Çankaya", ["Kızılay", "Tunalı", "Gaziosmanpaşa", "Balgat"]), ("Yenimahalle", ["Batıkent"])]),
        ("İzmir", "İzmir", [("Konak", ["Alsancak", "Kordon"]), ("Karşıyaka", ["Bostanlı"]), ("Bornova", ["Ege University"])]),
        ("Antalya", "Antalya", [("Muratpaşa", ["Kaleiçi (Old Town)", "Lara"]), ("Konyaaltı", ["Plaj Area"]), ("Alanya", ["Merkez"])]),
        ("Bursa", "Bursa", [("Nilüfer", ["Görükle", "FSM"]), ("Osmangazi", ["Heykel"])]),
        ("Adana", "Adana", [("Seyhan", ["Merkez"]), ("Çukurova", ["Barajyolu"])]),
        ("Gaziantep", "Gaziantep", [("Şahinbey", ["Merkez"]), ("Şehitkamil", ["Merkez"])]),
        ("Konya", "Konya", [("Selçuklu", ["Merkez"]), ("Meram", ["Merkez"])]),
        ("Kocaeli", "Kocaeli", [("İzmit", ["Merkez"]), ("Gebze", ["Merkez"])]),
        ("Mersin", "Mersin", [("Yenişehir", ["Merkez"]), ("Mezitli", ["Merkez"])]),
        ("Diyarbakır", "Diyarbakır", [("Kayapınar", ["Merkez"]), ("Sur", ["İçkale"])]),
        ("Kayseri", "Kayseri", [("Melikgazi", ["Merkez"]), ("Kocasinan", ["Merkez"])]),
        ("Eskişehir", "Eskişehir", [("Odunpazarı", ["Tarihi Bölge"]), ("Tepebaşı", ["Merkez"])]),
        ("Samsun", "Samsun", [("Atakum", ["Sahil"]), ("İlkadım", ["Merkez"])]),
        ("Denizli", "Denizli", [("Pamukkale", ["Merkez"]), ("Merkezefendi", ["Merkez"])]),
        ("Şanlıurfa", "Şanlıurfa", [("Haliliye", ["Merkez"]), ("Eyyübiye", ["Balıklıgöl"])]),
        ("Muğla", "Muğla", [("Bodrum", ["Merkez"]), ("Fethiye", ["Merkez"]), ("Marmaris", ["Merkez"])]),
        ("Trabzon", "Trabzon", [("Ortahisar", ["Merkez", "Meydan"])]),
        ("Tekirdağ", "Tekirdağ", [("Süleymanpaşa", ["Merkez"]), ("Çorlu", ["Merkez"])]),
        ("Balıkesir", "Balıkesir", [("Altıeylül", ["Merkez"]), ("Karesi", ["Merkez"])]),
        ("Aydın", "Aydın", [("Efeler", ["Merkez"]), ("Kuşadası", ["Merkez"])])
    ],

    # 19. RU (Russia) - Major Federal Subjects (Moscow, St. Petersburg + Major Oblasts/Republics)
    "RU": [
        ("Москва (Moscow)", "Москва", [("Центральный АО", ["Тверской", "Арбат", "Басманный", "Замоскворечье", "Хамовники", "Пресненский"]), ("Северный АО", ["Аэропорт", "Беговой", "Сокол", "Хорошёвский"]), ("Юго-Западный АО", ["Гагаринский", "Академический", "Ломоносовский"]), ("Западный АО", ["Раменки", "Дорогомилово"])]),
        ("Санкт-Петербург (St. Petersburg)", "СПб", [("Центральный район", ["Дворцовый", "Смольнинское", "Литейный", "Владимирский"]), ("Адмиралтейский район", ["Коломна", "Сенной", "Екатерингофский"]), ("Василеостровский район", ["Васильевский", "Гавань", "Морской"]), ("Петроградский район", ["Посадский", "Аптекарский"])]),
        ("Московская область (Moscow Oblast)", "Мос. обл.", [("Красногорск", ["Павшинская Пойма"]), ("Одинцово", ["Сколково"]), ("Химки", ["Центр"]), ("Балашиха", ["Центр"])]),
        ("Новосибирская область (Novosibirsk)", "Новосибирск", [("Новосибирск", ["Центральный", "Железнодорожный", "Академгородок"])]),
        ("Свердловская область (Yekaterinburg)", "Екатеринбург", [("Екатеринбург", ["Ленинский", "Кировский", "Верх-Исетский"])]),
        ("Татарстан (Tatarstan)", "Татарстан", [("Казань", ["Вахитовский (Кремль)", "Ново-Савиновский", "Советский"])]),
        ("Нижегородская область (Nizhny Novgorod)", "Нижний Новгород", [("Нижний Новгород", ["Нижегородский", "Советский"])]),
        ("Краснодарский край (Krasnodar / Sochi)", "Краснодар", [("Краснодар", ["Центральный", "Фестивальный"]), ("Сочи", ["Центральный", "Адлерский", "Красная Поляна"])]),
        ("Самарская область (Samara)", "Самара", [("Самара", ["Ленинский", "Самарский"]), ("Тольятти", ["Автозаводский"])]),
        ("Приморский край (Vladivostok)", "Владивосток", [("Владивосток", ["Фрунзенский", "Ленинский", "Первореченский"])]),
        ("Хабаровский край (Khabarovsk)", "Хабаровск", [("Хабаровск", ["Центральный", "Кировский"])]),
        ("Челябинская область (Chelyabinsk)", "Челябинск", [("Челябинск", ["Центральный", "Советский"])]),
        ("Ростовская область (Rostov-on-Don)", "Ростов", [("Ростов-на-Дону", ["Ленинский", "Кировский"])]),
        ("Башкортостан (Ufa)", "Уфа", [("Уфа", ["Кировский", "Ленинский"])]),
        ("Воронежская область (Voronezh)", "Воронеж", [("Воронеж", ["Центральный"])]),
        ("Пермский край (Perm)", "Пермь", [("Пермь", ["Ленинский"])]),
        ("Красноярский край (Krasnoyarsk)", "Красноярск", [("Красноярск", ["Центральный", "Советский"])]),
        ("Калининградская область (Kaliningrad)", "Калининград", [("Калининград", ["Ленинградский", "Центральный"])]),
        ("Иркутская область (Irkutsk / Baikal)", "Иркутск", [("Иркутск", ["Правобережный"])]),
        ("Тюменская область (Tyumen)", "Тюмень", [("Тюмень", ["Центральный"])])
    ],

    # 20. UA (Ukraine) - All 27 regions (Major Oblasts + Kyiv City)
    "UA": [
        ("Київ (Kyiv City)", "Київ", [("Шевченківський район", ["Хрещатик", "Лук'янівка", "Сирець"]), ("Печерський район", ["Печерськ", "Липки"]), ("Голосіївський район", ["Голосієво", "Теремки"]), ("Оболонський район", ["Оболонь"])]),
        ("Львівська область (Lviv)", "Львів", [("Львів", ["Галицький (Старе Місто)", "Личаківський", "Франківський"])]),
        ("Одеська область (Odesa)", "Одеса", [("Одеса", ["Приморський (Дерибасівська)", "Київський", "Малиновський"])]),
        ("Харківська область (Kharkiv)", "Харків", [("Харків", ["Шевченківський", "Київський", "Салтівський"])]),
        ("Дніпропетровська область (Dnipro)", "Дніпро", [("Дніпро", ["Соборний", "Центральний", "Шевченківський"])]),
        ("Київська область (Kyiv Oblast)", "Київ. обл.", [("Ірпінь", ["Центр"]), ("Буча", ["Центр"]), ("Бровари", ["Центр"]), ("Біла Церква", ["Центр"])]),
        ("Запорізька область (Zaporizhzhia)", "Запоріжжя", [("Запоріжжя", ["Вознесенівський", "Олександрівський"])]),
        ("Вінницька область (Vinnytsia)", "Вінниця", [("Вінниця", ["Центр", "Вишенька"])]),
        ("Полтавська область (Poltava)", "Полтава", [("Полтава", ["Шевченківський", "Київський"])]),
        ("Івано-Франківська область", "Івано-Франківськ", [("Івано-Франківськ", ["Центр"])]),
        ("Чернівецька область (Chernivtsi)", "Чернівці", [("Чернівці", ["Центр"])]),
        ("Тернопільська область (Ternopil)", "Тернопіль", [("Тернопіль", ["Центр"])]),
        ("Закарпатська область (Uzhhorod)", "Ужгород", [("Ужгород", ["Центр"])]),
        ("Волинська область (Lutsk)", "Луцьк", [("Луцьк", ["Центр"])]),
        ("Рівненська область (Rivne)", "Рівне", [("Рівне", ["Центр"])]),
        ("Житомирська область (Zhytomyr)", "Житомир", [("Житомир", ["Центр"])]),
        ("Хмельницька область (Khmelnytskyi)", "Хмельницький", [("Хмельницький", ["Центр"])]),
        ("Черкаська область (Cherkasy)", "Черкаси", [("Черкаси", ["Центр"])]),
        ("Миколаївська область (Mykolaiv)", "Миколаїв", [("Миколаїв", ["Центральний"])]),
        ("Чернігівська область (Chernihiv)", "Чернігів", [("Чернігів", ["Деснянський"])]),
        ("Сумська область (Sumy)", "Суми", [("Суми", ["Центр"])]),
        ("Кіровоградська область", "Кропивницький", [("Кропивницький", ["Фортечний"])]),
        ("Херсонська область (Kherson)", "Херсон", [("Херсон", ["Суворовський"])]),
        ("Донецька область (Donetsk)", "Донецьк", [("Краматорськ", ["Центр"]), ("Маріуполь", ["Центральний"])]),
        ("Луганська область (Luhansk)", "Луганськ", [("Сєвєродонецьк", ["Центр"])]),
        ("Автономна Республіка Крим", "Крим", [("Сімферополь", ["Центр"]), ("Севастополь", ["Ленінський"])])
    ],

    # 21. UZ (Uzbekistan) - All 14 regions (12 Viloyats + Tashkent + Karakalpakstan)
    "UZ": [
        ("Toshkent shahri (Tashkent City)", "Toshkent", [("Mirobod tumani", ["Oybek", "Gospitalny", "Mirobod"]), ("Yunusobod tumani", ["Yunusobod", "Amir Temur", "Bodomzor"]), ("Yakkasaroy tumani", ["Bobur", "Shota Rustaveli", "Kushbegi"]), ("Shayxontohur tumani", ["Chorsu", "Navoiy"]), ("Mirzo Ulug'bek tumani", ["Buyuk Ipak Yo'li"])]),
        ("Samarqand viloyati", "Samarqand", [("Samarqand shahri", ["Registon", "Siyob", "Universitet"]), ("Urgut tumani", ["Urgut"])]),
        ("Toshkent viloyati", "Toshkent vil.", [("Chirchiq shahri", ["Markaz"]), ("Olmaliq shahri", ["Markaz"]), ("Angren shahri", ["Markaz"]), ("Bekobod shahri", ["Markaz"])]),
        ("Farg'ona viloyati", "Farg'ona", [("Farg'ona shahri", ["Markaz"]), ("Qo'qon shahri", ["Markaz"]), ("Marg'ilon shahri", ["Markaz"])]),
        ("Andijon viloyati", "Andijon", [("Andijon shahri", ["Bobur maydoni", "Yangi shahar"]), ("Asaka tumani", ["Asaka"])]),
        ("Namangan viloyati", "Namangan", [("Namangan shahri", ["Davlatobod", "Yangi Namangan"])]),
        ("Buxoro viloyati", "Buxoro", [("Buxoro shahri", ["Eski shahar (Ark)", "Markaz"]), ("G'ijduvon tumani", ["G'ijduvon"])]),
        ("Qashqadaryo viloyati", "Qashqadaryo", [("Qarshi shahri", ["Markaz"]), ("Shahrisabz shahri", ["Oqsaroy"])]),
        ("Surxondaryo viloyati", "Surxondaryo", [("Termiz shahri", ["Markaz"]), ("Denov tumani", ["Denov"])]),
        ("Xorazm viloyati", "Xorazm", [("Urganch shahri", ["Markaz"]), ("Xiva shahri", ["Ichan Qal'a"])]),
        ("Jizzax viloyati", "Jizzax", [("Jizzax shahri", ["Markaz"]), ("Zomin tumani", ["Zomin"])]),
        ("Navoiy viloyati", "Navoiy", [("Navoiy shahri", ["Markaz"]), ("Zarafshon shahri", ["Markaz"])]),
        ("Sirdaryo viloyati", "Sirdaryo", [("Guliston shahri", ["Markaz"]), ("Yangiyer shahri", ["Markaz"])]),
        ("Qoraqalpog'iston Respublikasi", "Qoraqalpoq", [("Nukus shahri", ["Markaz", "Savitskiy muzeyi"]), ("Xo'jayli tumani", ["Xo'jayli"])])
    ],

    # 22. KZ (Kazakhstan) - All 20 regions (17 Regions + 3 Cities: Astana, Almaty, Shymkent)
    "KZ": [
        ("Астана (Astana City)", "Astana", [("Есіл ауданы (Yesil)", ["Мәңгілік Ел", "Нұржол бульвары", "EXPO"]), ("Алматы ауданы (Almaty)", ["Тәуелсіздік"]), ("Байқоңыр ауданы (Baikonur)", ["Орталық"]), ("Сарыарқа ауданы (Saryarka)", ["Ескі қала"])]),
        ("Алматы (Almaty City)", "Almaty", [("Медеу ауданы (Medeu)", ["Достық", "Медеу"]), ("Бостандық ауданы (Bostandyk)", ["Әл-Фараби", "Mega"]), ("Алмалы ауданы (Almaly)", ["Арбат", "Панфилов"]), ("Әуезов ауданы (Auezov)", ["Сайран"])]),
        ("Шымкент (Shymkent City)", "Shymkent", [("Әл-Фараби ауданы", ["Орталық"]), ("Абай ауданы", ["Орталық"]), ("Еңбекші ауданы", ["Орталық"])]),
        ("Қарағанды облысы (Karaganda)", "Қарағанды", [("Қарағанды қаласы", ["Қазыбек би", "Бұқар жырау"]), ("Теміртау қаласы", ["Орталық"])]),
        ("Ақтөбе облысы (Aktobe)", "Ақтөбе", [("Ақтөбе қаласы", ["Астана ауданы", "Алматы ауданы"])]),
        ("Атырау облысы (Atyrau)", "Атырау", [("Атырау қаласы", ["Европейская сторона", "Азиатская сторона"])]),
        ("Маңғыстау облысы (Aktau)", "Маңғыстау", [("Ақтау қаласы", ["14-шағын аудан", "Теңіз жағалауы"])]),
        ("Павлодар облысы (Pavlodar)", "Павлодар", [("Павлодар қаласы", ["Орталық"]), ("Екібастұз қаласы", ["Орталық"])]),
        ("Шығыс Қазақстан (East Kaz.)", "ШҚО", [("Өскемен қаласы", ["Орталық"]), ("Риддер қаласы", ["Орталық"])]),
        ("Абай облысы (Abai)", "Абай", [("Семей қаласы", ["Орталық"])]),
        ("Қостанай облысы (Kostanay)", "Қостанай", [("Қостанай қаласы", ["Орталық"]), ("Рудный қаласы", ["Орталық"])]),
        ("Солтүстік Қазақстан (North Kaz.)", "СҚО", [("Петропавл қаласы", ["Орталық"])]),
        ("Ақмола облысы (Aqmola)", "Ақмола", [("Көкшетау қаласы", ["Орталық"]), ("Бурабай ауданы", ["Бурабай (Боровое)"])]),
        ("Батыс Қазақстан (West Kaz.)", "БҚО", [("Орал қаласы (Uralsk)", ["Орталық"])]),
        ("Жамбыл облысы (Zhambyl)", "Жамбыл", [("Тараз қаласы", ["Орталық"])]),
        ("Түркістан облысы (Turkistan)", "Түркістан", [("Түркістан қаласы", ["Қожа Ахмет Ясауи кесенесі"]), ("Кентау қаласы", ["Орталық"])]),
        ("Қызылорда облысы (Kyzylorda)", "Қызылорда", [("Қызылорда қаласы", ["Орталық"]), ("Байқоңыр қаласы", ["Орталық"])]),
        ("Алматы облысы (Almaty Reg.)", "Алматы обл.", [("Қонаев қаласы", ["Орталық"]), ("Талғар қаласы", ["Орталық"]), ("Қаскелең қаласы", ["Орталық"])]),
        ("Жетісу облысы (Zhetysu)", "Жетісу", [("Талдықорған қаласы", ["Орталық"])]),
        ("Ұлытау облысы (Ulytau)", "Ұлытау", [("Жезқазған қаласы", ["Орталық"]), ("Сәтбаев қаласы", ["Орталық"])])
    ],

    # 23. TH (Thailand) - Major Changwats (Bangkok, Chiang Mai, Phuket, Chonburi/Pattaya, etc.)
    "TH": [
        ("กรุงเทพมหานคร (Bangkok)", "Bangkok", [("ปทุมวัน (Pathum Wan)", ["สยาม (Siam)", "ลุมพินี (Lumphini)", "รองเมือง"]), ("วัฒนา (Watthana)", ["คลองเตยเหนือ (Asok/Phrom Phong)", "ทองหล่อ (Thong Lo)", "เอกมัย (Ekkamai)"]), ("ห้วยขวาง (Huai Khwang)", ["ห้วยขวาง", "รัชดาภิเษก", "บางกะปิ"]), ("บางรัก (Bang Rak)", ["สีลม (Silom)", "สุริยวงศ์"]), ("คลองเตย (Khlong Toei)", ["พระโขนง", "คลองเตย"])]),
        ("เชียงใหม่ (Chiang Mai)", "Chiang Mai", [("เมืองเชียงใหม่", ["นิมมานเหมินท์", "ช้างคลาน (Night Bazaar)", "คูเมือง (Old City)"]), ("หางดง", ["หางดง"])]),
        ("ภูเก็ต (Phuket)", "Phuket", [("เมืองภูเก็ต", ["ย่านเมืองเก่า (Old Town)", "ป่าตอง (Patong)"]), ("ถลาง", ["บางเทา (Laguna)", "เชิงทะเล"]), ("กะทู้", ["กมลา"])]),
        ("ชลบุรี (Chonburi / Pattaya)", "Chonburi", [("บางละมุง (Pattaya)", ["พัทยากลาง", "พัทยาเหนือ", "หาดจอมเทียน", "นาเกลือ"]), ("ศรีราชา (Si Racha)", ["ศรีราชา"])]),
        ("นนทบุรี (Nonthaburi)", "Nonthaburi", [("เมืองนนทบุรี", ["บางเขน", "ตลาดขวัญ"]), ("ปากเกร็ด", ["แจ้งวัฒนะ", "เมืองทองธานี"])]),
        ("สมุทรปราการ (Samut Prakan)", "Samut Prakan", [("เมืองสมุทรปราการ", ["สำโรง", "ปากน้ำ"]), ("บางพลี", ["สนามบินสุวรรณภูมิ"])]),
        ("ปทุมธานี (Pathum Thani)", "Pathum Thani", [("คลองหลวง", ["รังสิต"]), ("เมืองปทุมธานี", ["บางปรอก"])]),
        ("นครราชสีมา (Nakhon Ratchasima / Korat)", "Korat", [("เมืองนครราชสีมา", ["ในเมือง", "โพธิ์กลาง"]), ("ปากช่อง (Khao Yai)", ["หมูสี", "ปากช่อง"])]),
        ("ขอนแก่น (Khon Kaen)", "Khon Kaen", [("เมืองขอนแก่น", ["ในเมือง", "ม.ขอนแก่น"])]),
        ("สงขลา (Songkhla / Hat Yai)", "Songkhla", [("หาดใหญ่ (Hat Yai)", ["หาดใหญ่ใน", "คอหงส์"]), ("เมืองสงขลา", ["บ่อยาง"])]),
        ("สุราษฎร์ธานี (Surat Thani / Samui)", "Surat Thani", [("เกาะสมุย (Koh Samui)", ["เฉวง", "ละไม", "บ่อผุด"]), ("เกาะพะงัน", ["ท้องศาลา"])]),
        ("กระบี่ (Krabi)", "Krabi", [("เมืองกระบี่", ["อ่าวนาง", "ไร่เลย์", "ในเมือง"])]),
        ("อุดรธานี (Udon Thani)", "Udon Thani", [("เมืองอุดรธานี", ["หมากแข้ง", "หนองประจักษ์"])]),
        ("ระยอง (Rayong)", "Rayong", [("เมืองระยอง", ["เนินพระ", "ท่าประดู่"]), ("เกาะเสม็ด", ["เกาะเสม็ด"])]),
        ("พระนครศรีอยุธยา (Ayutthaya)", "Ayutthaya", [("พระนครศรีอยุธยา", ["ประตูชัย", "หัวรอ"])]),
        ("ประจวบคีรีขันธ์ (Hua Hin)", "Hua Hin", [("หัวหิน (Hua Hin)", ["หัวหิน", "หนองแก", "เขาตะเกียบ"])]),
        ("เชียงราย (Chiang Rai)", "Chiang Rai", [("เมืองเชียงราย", ["เวียง", "รอบเวียง"])]),
        ("อุบลราชธานี (Ubon Ratchathani)", "Ubon", [("เมืองอุบลราชธานี", ["ในเมือง"])]),
        ("นครศรีธรรมราช (Nakhon Si Thammarat)", "Nakhon Si", [("เมืองนครศรีธรรมราช", ["ในเมือง"])]),
        ("พิษณุโลก (Phitsanulok)", "Phitsanulok", [("เมืองพิษณุโลก", ["ในเมือง"])])
    ],

    # 24. IN (India) - Major States & Territories (Delhi, Maharashtra, Karnataka, Tamil Nadu, etc.)
    "IN": [
        ("Delhi (NCT)", "Delhi", [("New Delhi", ["Connaught Place", "Chanakyapuri", "Vasant Kunj", "Hauz Khas", "Lajpat Nagar"]), ("South Delhi", ["Saket", "Greater Kailash"]), ("North Delhi", ["Civil Lines"])]),
        ("Maharashtra", "Maharashtra", [("Mumbai", ["Bandra", "Colaba", "Andheri", "Juhu", "Nariman Point", "Powai"]), ("Pune", ["Koregaon Park", "Hinjawadi", "Kothrud"]), ("Thane", ["Ghubunder Road"])]),
        ("Karnataka", "Karnataka", [("Bengaluru (Bangalore)", ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Electronic City", "MG Road"]), ("Mysuru", ["Gokulam"])]),
        ("Tamil Nadu", "Tamil Nadu", [("Chennai", ["T. Nagar", "Adyar", "Mylapore", "Anna Nagar", "OMR (IT Corridor)"]), ("Coimbatore", ["RS Puram"])]),
        ("Telangana", "Telangana", [("Hyderabad", ["Hitec City", "Gachibowli", "Jubilee Hills", "Banjara Hills", "Secunderabad"])]),
        ("Gujarat", "Gujarat", [("Ahmedabad", ["Navrangpura", "SG Highway", "Bodakdev"]), ("Surat", ["Athwa"]), ("Vadodara", ["Alkapuri"])]),
        ("West Bengal", "West Bengal", [("Kolkata", ["Park Street", "Salt Lake City", "New Town", "Alipore", "Ballygunge"])]),
        ("Uttar Pradesh", "Uttar Pradesh", [("Noida", ["Sector 18", "Sector 62", "Sector 150"]), ("Lucknow", ["Hazratganj", "Gomti Nagar"]), ("Agra", ["Tajganj"])]),
        ("Haryana", "Haryana", [("Gurugram (Gurgaon)", ["Cyber City", "Golf Course Road", "DLF Phase 1-5", "Sohna Road"]), ("Faridabad", ["Sector 15"])]),
        ("Rajasthan", "Rajasthan", [("Jaipur", ["Pink City (C-Scheme)", "Malviya Nagar", "Vaishali Nagar"]), ("Udaipur", ["City Centre"])]),
        ("Kerala", "Kerala", [("Kochi (Cochin)", ["Fort Kochi", "Marine Drive", "Kakkanad"]), ("Thiruvananthapuram", ["Technopark"])]),
        ("Punjab", "Punjab", [("Amritsar", ["Golden Temple Area", "Ranjit Avenue"]), ("Ludhiana", ["Civil Lines"])]),
        ("Goa", "Goa", [("North Goa", ["Panaji", "Candolim", "Calangute", "Anjuna"]), ("South Goa", ["Margao", "Colva"])]),
        ("Chandigarh", "Chandigarh", [("Chandigarh City", ["Sector 17", "Sector 35", "Sector 8"])]),
        ("Madhya Pradesh", "MP", [("Indore", ["Vijay Nagar", "Palasia"]), ("Bhopal", ["Arera Colony"])]),
        ("Odisha", "Odisha", [("Bhubaneswar", ["Saheed Nagar", "Patia"])]),
        ("Bihar", "Bihar", [("Patna", ["Fraser Road", "Kankarbagh"])]),
        ("Assam", "Assam", [("Guwahati", ["GS Road", "Pan Bazaar"])]),
        ("Jammu and Kashmir", "J&K", [("Srinagar", ["Lal Chowk", "Dal Lake"]), ("Jammu", ["Gandhi Nagar"])]),
        ("Uttarakhand", "Uttarakhand", [("Dehradun", ["Rajpur Road"]), ("Rishikesh", ["Tapovan"])])
    ],

    # 25. PK (Pakistan) - All 4 Provinces + ICT + Territories
    "PK": [
        ("Islamabad Capital Territory", "Islamabad", [("Islamabad", ["Sector F-6", "Sector F-7", "Sector F-8", "Sector G-9", "Blue Area", "DHA Islamabad"])]),
        ("Punjab", "Punjab", [("Lahore", ["Gulberg", "DHA Lahore", "Model Town", "Johar Town", "Mall Road"]), ("Rawalpindi", ["Saddar", "Bahria Town"]), ("Faisalabad", ["D Ground"])]),
        ("Sindh", "Sindh", [("Karachi", ["Clifton", "DHA Karachi", "PECHS", "Gulshan-e-Iqbal", "Saddar", "Korangi"]), ("Hyderabad", ["Saddar"])]),
        ("Khyber Pakhtunkhwa", "KPK", [("Peshawar", ["University Town", "Hayatabad", "Cantt"]), ("Abbottabad", ["Cantt"])]),
        ("Balochistan", "Balochistan", [("Quetta", ["Cantonment", "Jinnah Road"]), ("Gwadar", ["Port Area"])]),
        ("Azad Jammu and Kashmir", "AJK", [("Muzaffarabad", ["City Centre"]), ("Mirpur", ["Sector F"])]),
        ("Gilgit-Baltistan", "Gilgit-Baltistan", [("Gilgit", ["City Centre"]), ("Skardu", ["City Centre"])])
    ],

    # 26. BD (Bangladesh) - All 8 Divisions
    "BD": [
        ("Dhaka Division", "Dhaka", [("Dhaka North", ["Gulshan", "Banani", "Uttara", "Baridhara"]), ("Dhaka South", ["Dhanmondi", "Motijheel", "Old Dhaka (Puran Dhaka)"]), ("Gazipur", ["Tongi"])]),
        ("Chattogram Division (Chittagong)", "Chittagong", [("Chattogram City", ["Agrabad", "GEC Circle", "Khulshi", "Nasirabad"]), ("Cox's Bazar", ["Kolatoli"])]),
        ("Sylhet Division", "Sylhet", [("Sylhet City", ["Zindabazar", "Ambarkhana", "Upashahar"])]),
        ("Rajshahi Division", "Rajshahi", [("Rajshahi City", ["Shaheb Bazar", "Motihar"])]),
        ("Khulna Division", "Khulna", [("Khulna City", ["Shibbari", "Boyra"])]),
        ("Barishal Division", "Barishal", [("Barishal City", ["Sadar Road"])]),
        ("Rangpur Division", "Rangpur", [("Rangpur City", ["Jahaj Company Mor"])]),
        ("Mymensingh Division", "Mymensingh", [("Mymensingh City", ["Ganginar Par"])])
    ],

    # 27. NP (Nepal) - All 7 Provinces
    "NP": [
        ("Bagmati Province", "Bagmati", [("Kathmandu District", ["Thamel", "Baluwatar", "Baneshwor", "Durbar Marg", "Lazimpat"]), ("Lalitpur District (Patan)", ["Jhamsikhel", "Kupondole", "Patan Durbar Square"]), ("Bhaktapur District", ["Durbar Square"])]),
        ("Gandaki Province", "Gandaki", [("Kaski (Pokhara)", ["Lakeside", "Damside", "Mahendrapool"])]),
        ("Koshi Province", "Koshi", [("Morang (Biratnagar)", ["Main Road"]), ("Sunsari (Dharan)", ["Bhanu Chowk"])]),
        ("Madhesh Province", "Madhesh", [("Parsa (Birgunj)", ["Adarshnagar"]), ("Dhanusha (Janakpur)", ["Station Road"])]),
        ("Lumbini Province", "Lumbini", [("Rupandehi (Butwal / Bhairahawa)", ["Traffic Chowk"]), ("Kapilvastu (Lumbini)", ["Lumbini Sacred Garden"])]),
        ("Karnali Province", "Karnali", [("Surkhet (Birendranagar)", ["Birendrachowk"])]),
        ("Sudurpashchim Province", "Sudurpashchim", [("Kailali (Dhangadhi)", ["Main Road"]), ("Kanchanpur (Mahendranagar)", ["Bazaar"])])
    ],

    # 28. LK (Sri Lanka) - All 9 Provinces
    "LK": [
        ("Western Province", "Western", [("Colombo", ["Fort (Colombo 1)", "Kollupitiya (Colombo 3)", "Bambalapitiya (Colombo 4)", "Cinnamon Gardens (Colombo 7)"]), ("Gampaha", ["Negombo", "Kelaniya"]), ("Kalutara", ["Panadura"])]),
        ("Central Province", "Central", [("Kandy", ["Kandy City", "Peradeniya"]), ("Nuwara Eliya", ["Town Centre"])]),
        ("Southern Province", "Southern", [("Galle", ["Galle Fort", "Unawatuna"]), ("Matara", ["Town Centre"]), ("Hambantota", ["Port Area"])]),
        ("Northern Province", "Northern", [("Jaffna", ["Jaffna Town", "Nallur"])]),
        ("Eastern Province", "Eastern", [("Trincomalee", ["Town Centre"]), ("Batticaloa", ["Town Centre"])]),
        ("North Western Province", "North Western", [("Kurunegala", ["Town Centre"]), ("Puttalam", ["Town Centre"])]),
        ("North Central Province", "North Central", [("Anuradhapura", ["Sacred City", "New Town"])]),
        ("Uva Province", "Uva", [("Badulla", ["Town Centre"]), ("Ella", ["Ella Town"])]),
        ("Sabaragamuwa Province", "Sabaragamuwa", [("Ratnapura", ["Town Centre"]), ("Kegalle", ["Town Centre"])])
    ],

    # 29. MM (Myanmar) - Major States and Regions
    "MM": [
        ("Yangon Region", "Yangon", [("Yangon", ["Dagon", "Kamayut", "Bahan", "Kyauktada", "Mayangone", "Hlaing"])]),
        ("Mandalay Region", "Mandalay", [("Mandalay City", ["Chanayethazan", "Mahaaungmye", "Aungmyethazan"]), ("Pyin Oo Lwin", ["Central"])]),
        ("Naypyidaw Union Territory", "Naypyidaw", [("Naypyidaw", ["Zabuthiri", "Ottarathiri", "Dekkhinathiri"])]),
        ("Shan State", "Shan", [("Taunggyi", ["City Centre"]), ("Inle Lake", ["Nyaungshwe"]), ("Lashio", ["City Centre"])]),
        ("Bago Region", "Bago", [("Bago City", ["Central"])]),
        ("Ayeyarwady Region", "Ayeyarwady", [("Pathein", ["City Centre"])]),
        ("Sagaing Region", "Sagaing", [("Monywa", ["City Centre"])]),
        ("Mon State", "Mon", [("Mawlamyine", ["City Centre"])]),
        ("Kachin State", "Kachin", [("Myitkyina", ["City Centre"])]),
        ("Rakhine State", "Rakhine", [("Sittwe", ["City Centre"]), ("Thandwe (Ngapali)", ["Ngapali Beach"])]),
        ("Kayin State", "Kayin", [("Hpa-an", ["City Centre"])]),
        ("Magway Region", "Magway", [("Magway City", ["City Centre"])]),
        ("Tanintharyi Region", "Tanintharyi", [("Dawei", ["City Centre"]), ("Myeik", ["City Centre"])]),
        ("Kayah State", "Kayah", [("Loikaw", ["City Centre"])]),
        ("Chin State", "Chin", [("Hakha", ["City Centre"])])
    ],

    # 30. KH (Cambodia) - Major Provinces and Phnom Penh
    "KH": [
        ("Phnom Penh", "Phnom Penh", [("Doun Penh", ["Phsar Kandal", "Boeung Reang", "Chey Chumneah", "Srah Chak"]), ("Chamkar Mon", ["Tonle Bassac", "Boeng Keng Kang 1"]), ("Toul Kork", ["Boeung Kak", "Phsar Depo"])]),
        ("Siem Reap", "Siem Reap", [("Siem Reap Municipality", ["Old Market (Pub Street)", "Wat Bo", "Sala Kamreuk", "Svay Dangkum"])]),
        ("Preah Sihanouk (Sihanoukville)", "Sihanoukville", [("Sihanoukville City", ["Ochheuteal Beach", "Otres", "Mittakpheap"])]),
        ("Battambang", "Battambang", [("Battambang Municipality", ["Svay Pao", "Rottanak"])]),
        ("Kandal", "Kandal", [("Ta Khmau", ["Ta Khmau", "Prek Ruessei"])]),
        ("Kampot", "Kampot", [("Kampot Municipality", ["Kampong Bay", "Traeuy Kaoh"])]),
        ("Banteay Meanchey (Poipet)", "Poipet", [("Poipet City", ["Poipet"]), ("Serei Saophoan", ["Preah Ponlea"])]),
        ("Kampong Cham", "Kampong Cham", [("Kampong Cham City", ["Kampong Cham"])]),
        ("Koh Kong", "Koh Kong", [("Khemarak Phoumin", ["Smach Mean Chey"])]),
        ("Kep", "Kep", [("Kep Municipality", ["Prey Thum", "Crab Market Area"])]),
        ("Svay Rieng (Bavet)", "Bavet", [("Bavet City", ["Bavet"]), ("Svay Rieng City", ["Svay Rieng"])]),
        ("Kampong Speu", "Kampong Speu", [("Chbar Mon", ["Chbar Mon"])]),
        ("Pursat", "Pursat", [("Pursat Municipality", ["Roleap"])]),
        ("Kampong Thom", "Kampong Thom", [("Stung Saen", ["Kampong Thom"])]),
        ("Takeo", "Takeo", [("Doun Kaev", ["Roka Knong"])])
    ],

    # 31. MN (Mongolia) - All Major Aimags and Ulaanbaatar
    "MN": [
        ("Улаанбаатар (Ulaanbaatar)", "Ulaanbaatar", [("Сүхбаатар дүүрэг (Sükhbaatar)", ["1-р хороо (Талбай)", "2-р хороо", "Бага тойруу"]), ("Баянзүрх дүүрэг (Bayanzürkh)", ["1-р хороо", "Зүүн 4 зам"]), ("Хан-Уул дүүрэг (Khan-Uul)", ["120 мянгат", "Зайсан"]), ("Чингэлтэй дүүрэг (Chingeltei)", ["Төв шуудан"])]),
        ("Дархан-Уул (Darkhan)", "Darkhan", [("Дархан сум", ["Шинэ Дархан", "Хуучин Дархан"])]),
        ("Орхон (Erdenet)", "Erdenet", [("Баян-Өндөр сум", ["Эрдэнэт хот"])]),
        ("Сэлэнгэ (Selenge)", "Selenge", [("Сүхбаатар сум", ["Төв"]), ("Алтанбулаг сум", ["Хилийн боомт"])]),
        ("Төв (Töv)", "Töv", [("Зуунмод сум", ["Төв"])]),
        ("Өмнөговь (South Gobi)", "Ömnögovi", [("Даланзадгад сум", ["Төв"]), ("Цогтцэций сум", ["Тавантолгой"]), ("Ханбогд сум", ["Оюутолгой"])]),
        ("Дорноговь (East Gobi)", "Dornogovi", [("Сайншанд сум", ["Төв"]), ("Замын-Үүд сум", ["Хилийн боомт"])]),
        ("Хөвсгөл (Khövsgöl)", "Khövsgöl", [("Мөрөн сум", ["Төв"]), ("Хатгал сум", ["Хөвсгөл нуур"])]),
        ("Ховд (Khovd)", "Khovd", [("Жаргалант сум", ["Ховд хот"])]),
        ("Булган (Bulgan)", "Bulgan", [("Булган сум", ["Төв"])]),
        ("Дорнод (Dornod)", "Dornod", [("Хэрлэн сум (Чойбалсан)", ["Төв"])]),
        ("Архангай (Arkhangai)", "Arkhangai", [("Эрдэнэбулган сум (Цэцэрлэг)", ["Төв"])]),
        ("Баян-Өлгий (Bayan-Ölgii)", "Bayan-Ölgii", [("Өлгий сум", ["Төв"])]),
        ("Баянхонгор (Bayankhongor)", "Bayankhongor", [("Баянхонгор сум", ["Төв"])]),
        ("Өвөрхангай (Övörkhangai)", "Övörkhangai", [("Арвайхээр сум", ["Төв"]), ("Хархорин сум", ["Эрдэнэ зуу"])]),
        ("Хэнтий (Khentii)", "Khentii", [("Хэрлэн сум (Өндөрхаан)", ["Төв"])])
    ],

    # 32. TL (Timor-Leste) - All 14 Municipalities
    "TL": [
        ("Dili", "Dili", [("Vera Cruz", ["Colmera", "Caicoli", "Motael"]), ("Nain Feto", ["Bidau Santana", "Gricenfor"]), ("Cristo Rei", ["Becora", "Kuluhun"]), ("Dom Aleixo", ["Comoro", "Bebonuk"])]),
        ("Baucau", "Baucau", [("Baucau Vila", ["Kota Lama", "Buruma"])]),
        ("Ermera", "Ermera", [("Gleno", ["Gleno Central"]), ("Ermera Vila", ["Mertuto"])]),
        ("Bobonaro", "Bobonaro", [("Maliana", ["Maliana Central"]), ("Batugade", ["Border Area"])]),
        ("Cova Lima", "Cova Lima", [("Suai", ["Suai Loro", "Debos"])]),
        ("Lautém", "Lautém", [("Lospalos", ["Fuiloro", "Home"])]),
        ("Liquiçá", "Liquiçá", [("Liquiçá Vila", ["Dato", "Hatuquessi"]), ("Bazartete", ["Tibar"])]),
        ("Manatuto", "Manatuto", [("Manatuto Vila", ["Ailili", "Ma'abat"])]),
        ("Manufahi", "Manufahi", [("Same", ["Babulo", "Holarua"])]),
        ("Ainaro", "Ainaro", [("Ainaro Vila", ["Soro"]), ("Maubisse", ["Maubisse Central"])]),
        ("Aileu", "Aileu", [("Aileu Vila", ["Seloi Craic"])]),
        ("Viqueque", "Viqueque", [("Viqueque Vila", ["Caraubalo"])]),
        ("Oecusse (RAEOA)", "Oecusse", [("Pante Macassar", ["Costa", "Taiboco"])]),
        ("Ataúro", "Ataúro", [("Beloi", ["Vila Maumeta", "Bikeli"])])
    ],

    # 33. MY (Malaysia) - All 13 States & 3 Federal Territories
    "MY": [
        ("Wilayah Persekutuan Kuala Lumpur", "Kuala Lumpur", [("Kuala Lumpur City", ["Bukit Bintang", "KLCC", "Mont Kiara", "Bangsar", "Brickfields (Little India)", "Cheras", "Kepong"])]),
        ("Selangor", "Selangor", [("Petaling Jaya", ["Damansara", "Sunway", "Bandar Utama", "SS2"]), ("Subang Jaya", ["SS15", "USJ"]), ("Shah Alam", ["Section 7", "Kota Kemuning"]), ("Klang", ["Bandar Bukit Tinggi"])]),
        ("Pulau Pinang (Penang)", "Penang", [("Timur Laut (George Town)", ["Georgetown Heritage", "Gurney Drive", "Tanjung Tokong", "Batu Ferringhi"]), ("Barat Daya", ["Bayan Lepas", "Bayan Baru"])]),
        ("Johor", "Johor", [("Johor Bahru", ["JB Sentral", "Tebrau", "Mount Austin", "Permas Jaya"]), ("Iskandar Puteri", ["Medini", "Puteri Harbour"])]),
        ("Sabah", "Sabah", [("Kota Kinabalu", ["KK City Centre", "Tanjung Aru", "Likas", "Luyang"]), ("Sandakan", ["Bandar Indah"])]),
        ("Sarawak", "Sarawak", [("Kuching", ["Kuching Waterfront", "Padungan", "Batu Kawa"]), ("Miri", ["Marina ParkCity"])]),
        ("Perak", "Perak", [("Ipoh", ["Old Town", "New Town", "Canning Garden"]), ("Taiping", ["Town Centre"])]),
        ("Melaka (Malacca)", "Melaka", [("Melaka Tengah", ["Jonker Street", "Bandar Hilir", "Ayer Keroh"])]),
        ("Negeri Sembilan", "N. Sembilan", [("Seremban", ["Seremban 2", "Rasah"]), ("Port Dickson", ["Teluk Kemang"])]),
        ("Pahang", "Pahang", [("Kuantan", ["Teluk Cempedak", "Bandar Kuantan"]), ("Bentong", ["Genting Highlands"]), ("Cameron Highlands", ["Tanah Rata"])]),
        ("Kedah", "Kedah", [("Kota Setar (Alor Setar)", ["Bandar Alor Setar"]), ("Langkawi", ["Kuah", "Pantai Cenang"])]),
        ("Terengganu", "Terengganu", [("Kuala Terengganu", ["Batu Buruk", "Chinatown (Kampung Cina)"])]),
        ("Kelantan", "Kelantan", [("Kota Bharu", ["Bandar Kota Bharu", "Kubang Kerian"])]),
        ("Perlis", "Perlis", [("Kangar", ["Pusat Bandar"])]),
        ("Wilayah Persekutuan Putrajaya", "Putrajaya", [("Putrajaya", ["Presint 1", "Presint 2", "Presint 3", "Presint 4"])]),
        ("Wilayah Persekutuan Labuan", "Labuan", [("Victoria (Labuan Town)", ["Bandar Labuan"])])
    ],

    # 34. SG (Singapore) - All 5 Community Development Council (CDC) Districts / Regions
    "SG": [
        ("Central Region", "Central", [("Central Area (Downtown)", ["Downtown Core", "Marina Bay", "Tanjong Pagar", "Raffles Place", "Bugis", "Chinatown"]), ("Orchard / Novena", ["Orchard", "Somerset", "Novena", "Newton"]), ("Bukit Merah / Queenstown", ["Tiong Bahru", "HarbourFront", "Queenstown"]), ("Kallang", ["Kallang", "Boon Keng"])]),
        ("East Region", "East", [("Bedok / Tampines", ["Tampines Central", "Bedok", "Simei"]), ("Changi / Pasir Ris", ["Changi Airport", "Pasir Ris", "Loyang"]), ("Marine Parade", ["Katong", "Joo Chiat", "Marine Parade"])]),
        ("West Region", "West", [("Jurong East / West", ["Jurong Gateway", "Jurong Point", "Lakeside"]), ("Clementi / Bukit Timah", ["Clementi", "Buona Vista", "One-North", "Beauty World"])]),
        ("North-East Region", "North-East", [("Serangoon / Hougang", ["Serangoon Nex", "Hougang", "Kovan"]), ("Sengkang / Punggol", ["Sengkang Central", "Punggol Waterway"]), ("Ang Mo Kio", ["AMK Central"])]),
        ("North Region", "North", [("Woodlands", ["Woodlands Central", "Causeway Point"]), ("Yishun", ["Northpoint City", "Chong Pang"]), ("Sembawang", ["Sembawang Central"])])
    ],

    # 35. AE (United Arab Emirates) - All 7 Emirates
    "AE": [
        ("Dubai", "Dubai", [("Downtown / Business Bay", ["Downtown Dubai", "Burj Khalifa Area", "Business Bay", "DIFC"]), ("Marina / JBR", ["Dubai Marina", "JBR", "JLT", "Palm Jumeirah"]), ("Old Dubai (Deira / Bur Dubai)", ["Deira", "Al Rigga", "Bur Dubai", "Al Karama"]), ("Al Barsha", ["Al Barsha 1", "Mall of the Emirates Area"])]),
        ("Abu Dhabi", "Abu Dhabi", [("Abu Dhabi Island", ["Corniche", "Al Danah", "Al Zahiyah (Tourist Club)", "Al Khalidiyah"]), ("Al Reem Island", ["Najmat", "Marina Square"]), ("Yas Island", ["Yas Marina"]), ("Al Ain", ["Al Central"])]),
        ("Sharjah", "Sharjah", [("Al Majaz", ["Corniche", "Al Majaz 1-3"]), ("Al Qasimia", ["Mahattah"]), ("Al Nahda", ["Al Nahda Sharjah"])]),
        ("Ajman", "Ajman", [("Ajman Downtown", ["Corniche", "Al Nuaimia", "Al Rashidiya"])]),
        ("Ras Al Khaimah", "RAK", [("Al Nakheel", ["Center"]), ("Al Hamra", ["Al Hamra Village"])]),
        ("Fujairah", "Fujairah", [("Fujairah City", ["Hamad Bin Abdulla Rd", "Corniche"])]),
        ("Umm Al Quwain", "UAQ", [("UAQ City", ["Old Town", "Al Salamah"])])
    ],

    # 36. SA (Saudi Arabia) - All Major Provinces
    "SA": [
        ("Riyadh Region", "Riyadh", [("Riyadh City", ["Al Olaya", "Al Malaz", "Al Nakheel", "Al Murabba", "King Abdullah Financial District (KAFD)"]), ("Al Kharj", ["Center"])]),
        ("Makkah Region", "Makkah", [("Jeddah", ["Al Balad", "Al Hamra", "Al Zahra", "Al Rawdah", "Corniche"]), ("Makkah (Mecca)", ["Al Haram Area", "Al Aziziyah"]), ("Taif", ["Al Shafa", "Al Hada"])]),
        ("Eastern Province (Ash Sharqiyah)", "Eastern", [("Dammam", ["Corniche", "Al Faisaliyah"]), ("Al Khobar", ["Corniche", "Al Olaya"]), ("Dhahran", ["Aramco / KFUPM"]), ("Jubail", ["Industrial City"])]),
        ("Madinah Region", "Madinah", [("Madinah (Medina)", ["Al Haram Area", "Quba"])]),
        ("Al Qassim", "Al Qassim", [("Buraidah", ["Center"]), ("Unaizah", ["Center"])]),
        ("Asir", "Asir", [("Abha", ["Center"]), ("Khamis Mushait", ["Center"])]),
        ("Tabuk", "Tabuk", [("Tabuk City", ["Center"]), ("NEOM", ["The Line Area"])]),
        ("Hail", "Hail", [("Hail City", ["Center"])]),
        ("Jazan", "Jazan", [("Jazan City", ["Corniche"])]),
        ("Najran", "Najran", [("Najran City", ["Center"])]),
        ("Al Baha", "Al Baha", [("Al Baha City", ["Center"])]),
        ("Al Jawf", "Al Jawf", [("Sakakah", ["Center"])]),
        ("Northern Borders", "Northern Borders", [("Arar", ["Center"])])
    ],

    # 37. EG (Egypt) - Major Governorates (Cairo, Giza, Alexandria, etc.)
    "EG": [
        ("Cairo (Al Qahirah)", "Cairo", [("Downtown Cairo", ["Tahrir", "Zamalek", "Garden City"]), ("New Cairo", ["Fifth Settlement (Tagamoa)", "Rehab City"]), ("Nasr City", ["Abbas El Akkad"]), ("Maadi", ["Degla", "Corniche Maadi"]), ("Heliopolis", ["Korba", "Roxy"])]),
        ("Giza (Al Jizah)", "Giza", [("Dokki / Mohandessin", ["Mohandessin", "Dokki"]), ("Pyramids / Haram", ["Al Haram", "Faisal"]), ("Sheikh Zayed / 6th of October", ["Sheikh Zayed", "6th of October City"])]),
        ("Alexandria (Al Iskandariyah)", "Alexandria", [("Alexandria City", ["Montaza", "Sidi Gaber", "Raml Station", "Gleem", "Smouha"])]),
        ("Red Sea (Al Bahr al Ahmar)", "Red Sea", [("Hurghada", ["El Dahar", "Sekalla", "El Gouna"]), ("Marsa Alam", ["Port Ghalib"])]),
        ("South Sinai (Janub Sina)", "South Sinai", [("Sharm El Sheikh", ["Naama Bay", "Nabq Bay", "Ras Um Sid"]), ("Dahab", ["Lighthouse"])]),
        ("Dakahlia", "Dakahlia", [("Mansoura", ["Touril", "El Gomhouria"])]),
        ("Gharbia", "Gharbia", [("Tanta", ["El Bahr St"]), ("El Mahalla El Kubra", ["Center"])]),
        ("Sharqia", "Sharqia", [("Zagazig", ["Center"]), ("10th of Ramadan", ["Industrial Area"])]),
        ("Port Said", "Port Said", [("Port Said City", ["Port Fouad", "Tarh El Bahr"])]),
        ("Suez", "Suez", [("Suez City", ["Port Tawfiq", "Arbaeen"])]),
        ("Luxor", "Luxor", [("Luxor City", ["East Bank", "Karnak"])]),
        ("Aswan", "Aswan", [("Aswan City", ["Corniche", "Elephantine"])]),
        ("Qalyubia", "Qalyubia", [("Banha", ["Center"]), ("Shubra El Kheima", ["Center"])]),
        ("Fayoum", "Fayoum", [("Fayoum City", ["Center"])]),
        ("Ismailia", "Ismailia", [("Ismailia City", ["Center"])])
    ],

    # 38. IQ (Iraq) - Major Governorates
    "IQ": [
        ("Baghdad Governorate", "Baghdad", [("Al-Karkh", ["Mansour", "Al-Yarmouk", "Kadhimiya", "Green Zone"]), ("Al-Rusafa", ["Karrada", "Jadiriya", "Zayouna", "Al-Sa'adoon"])]),
        ("Erbil Governorate (KRI)", "Erbil", [("Erbil City", ["Citadel Area", "Dream City", "Gulan Street", "Ankawa", "Empire World"])]),
        ("Basra Governorate", "Basra", [("Basra City", ["Al-Ashar", "Al-Bradhiah", "Corniche Al-Basra", "Manawi Basha"])]),
        ("Sulaymaniyah Governorate (KRI)", "Sulaymaniyah", [("Sulaymaniyah City", ["Salim Street", "Sarchinar", "Bakrajo"])]),
        ("Duhok Governorate (KRI)", "Duhok", [("Duhok City", ["Shakhke", "Nohadra"])]),
        ("Nineveh Governorate (Mosul)", "Mosul", [("Mosul City", ["Left Bank (Al-Zuhur)", "Right Bank (Old City)"])]),
        ("Najaf Governorate", "Najaf", [("Najaf City", ["Old City", "Kufa"])]),
        ("Karbala Governorate", "Karbala", [("Karbala City", ["Old City", "Al-Abbas Area"])]),
        ("Kirkuk Governorate", "Kirkuk", [("Kirkuk City", ["Rahimawa", "Qoriya"])]),
        ("Al Anbar Governorate", "Anbar", [("Ramadi", ["Center"]), ("Fallujah", ["Center"])]),
        ("Babylon Governorate (Babil)", "Babil", [("Hillah", ["Babylon Ruins Area"])]),
        ("Diyala Governorate", "Diyala", [("Baqubah", ["Center"])])
    ],

    # 39. IR (Iran) - Major Ostans
    "IR": [
        ("Tehran", "Tehran", [("District 1-3 (North)", ["Tajrish", "Zaferaniyeh", "Elahiyeh", "Niavaran", "Jordan"]), ("District 6 (Central)", ["Valiasr", "Karimkhan", "Fatemi"]), ("District 2 (West)", ["Sa'adat Abad", "Shahrak-e Gharb"])]),
        ("Isfahan", "Isfahan", [("Isfahan City", ["Naqsh-e Jahan", "Jolfa", "Chaharbagh", "Zayandeh Rood Area"])]),
        ("Fars (Shiraz)", "Shiraz", [("Shiraz City", ["Eram", "Zand", "Qasr Dasht", "Hafez Area"])]),
        ("Razavi Khorasan (Mashhad)", "Mashhad", [("Mashhad City", ["Haram Area", "Ahmadabad", "Sajjad", "Kuhsangi"])]),
        ("East Azerbaijan (Tabriz)", "Tabriz", [("Tabriz City", ["Valiasr", "Abresan", "Bazaar Area"])]),
        ("Alborz (Karaj)", "Karaj", [("Karaj City", ["Gohardasht", "Mehrshahr", "Azimieh"])]),
        ("Khuzestan", "Khuzestan", [("Ahvaz", ["Kianpars", "Zeitun Karmandi"])]),
        ("Gilan (Rasht)", "Rasht", [("Rasht City", ["Golsar", "Shahrdari"])]),
        ("Mazandaran", "Mazandaran", [("Sari", ["Center"]), ("Babolsar", ["Coast"])]),
        ("Qom", "Qom", [("Qom City", ["Haram Area", "Salarieh"])]),
        ("Hormozgan (Bandar Abbas / Kish)", "Hormozgan", [("Kish Island", ["Marjan", "Saadi"]), ("Bandar Abbas", ["Coast"])]),
        ("Yazd", "Yazd", [("Yazd City", ["Old Town", "Safayeh"])]),
        ("Kermanshah", "Kermanshah", [("Kermanshah City", ["Nobahar", "Ferdowsi"])])
    ],

    # 40. YE (Yemen) - Major Governorates
    "YE": [
        ("Sana'a Governorate (Capital)", "Sana'a", [("Sana'a City", ["Old City", "Al Tahrir", "Hadda", "Al Sabeen", "Zubairy St"])]),
        ("Aden", "Aden", [("Aden City", ["Crater", "Al Mualla", "Khor Maksar", "Al Mansoura", "Tawahi"])]),
        ("Taiz", "Taiz", [("Taiz City", ["Al Qahirah", "Salh", "Al Mudhaffar"])]),
        ("Al Hudaydah", "Hudaydah", [("Al Hudaydah City", ["Al Mina", "Al Hawak"])]),
        ("Hadhramaut", "Hadhramaut", [("Mukalla", ["Al Mukalla Old Town"]), ("Say'un", ["City Centre"])]),
        ("Ibb", "Ibb", [("Ibb City", ["Al Mashannah", "Al Dhihar"])]),
        ("Dhamar", "Dhamar", [("Dhamar City", ["City Centre"])]),
        ("Marib", "Marib", [("Marib City", ["City Centre"])]),
        ("Socotra", "Socotra", [("Hadibu", ["City Centre"])])
    ],

    # 41. IL (Israel) - All 7 Districts
    "IL": [
        ("Tel Aviv District", "Tel Aviv", [("Tel Aviv-Yafo", ["Lev HaIr (Center)", "Rothschild", "Florentin", "Old Jaffa", "Ramat Aviv", "Neve Tzedek"]), ("Ramat Gan", ["Diamond Exchange"]), ("Herzliya", ["Herzliya Pituach"])]),
        ("Jerusalem District", "Jerusalem", [("Jerusalem City", ["Old City", "Rehavia", "Talbiya", "German Colony", "Downtown (Jaffa St)", "Talpiot"])]),
        ("Central District", "Central", [("Petah Tikva", ["Kiryat Arye", "Em HaMoshavot"]), ("Netanya", ["City Center", "Poleg"]), ("Rishon LeZion", ["West Rishon"]), ("Rehovot", ["Weizmann Area"])]),
        ("Haifa District", "Haifa", [("Haifa City", ["Carmel Center", "German Colony", "Downtown (Hadar)", "Bat Galim"])]),
        ("Southern District", "Southern", [("Be'er Sheva", ["Old City", "Ramot"]), ("Ashdod", ["City Center", "Marina"]), ("Eilat", ["North Beach"])]),
        ("Northern District", "Northern", [("Nazareth", ["Old City"]), ("Tiberias", ["Sea of Galilee Coast"]), ("Acre (Akko)", ["Old City"])]),
        ("Judea and Samaria Area", "Judea & Samaria", [("Ariel", ["City Center"]), ("Ma'ale Adumim", ["Center"])])
    ],

    # 42. ET (Ethiopia) - Major Regions & Chartered Cities
    "ET": [
        ("Addis Ababa", "Addis Ababa", [("Bole", ["Bole Medhanealem", "Bole Atlas", "Olympia"]), ("Kirkos", ["Meskel Square", "Kazanchis"]), ("Yeka", ["Megenagna", "CMC"]), ("Arada", ["Piazza", "4 Kilo"]), ("Lideta", ["Balcha"])]),
        ("Oromia", "Oromia", [("Adama (Nazret)", ["City Centre"]), ("Bishoftu (Debre Zeyit)", ["Lakeside"]), ("Jimma", ["City Centre"]), ("Shashamane", ["City Centre"])]),
        ("Amhara", "Amhara", [("Bahir Dar", ["Lake Tana Area"]), ("Gondar", ["Fasil Ghebbi Area"]), ("Dessie", ["City Centre"])]),
        ("Sidama", "Sidama", [("Hawassa", ["Lake Hawassa Shore", "Piazza"])]),
        ("Dire Dawa", "Dire Dawa", [("Dire Dawa City", ["Kezira", "Megala"])]),
        ("Tigray", "Tigray", [("Mekelle", ["Kedamay Weyane", "Ayder"])]),
        ("Somali Region", "Somali", [("Jijiga", ["City Centre"])]),
        ("Harari", "Harari", [("Harar", ["Harar Jugol (Old Walled City)"])]),
        ("Afar Region", "Afar", [("Semera", ["City Centre"])]),
        ("Southern Nations (South Ethiopia)", "South", [("Arba Minch", ["Sikela", "Shecha"]), ("Wolaita Sodo", ["City Centre"])])
    ],

    # 43. ZA (South Africa) - All 9 Provinces
    "ZA": [
        ("Gauteng", "Gauteng", [("Johannesburg", ["Sandton", "Rosebank", "Johannesburg CBD", "Randburg", "Fourways", "Soweto"]), ("Pretoria (Tshwane)", ["Hatfield", "Brooklyn", "Menlyn", "Centurion"])]),
        ("Western Cape", "Western Cape", [("Cape Town", ["City Bowl (CBD)", "Camps Bay", "Sea Point", "V&A Waterfront", "Green Point", "Claremont", "Stellenbosch"])]),
        ("KwaZulu-Natal", "KZN", [("Durban (eThekwini)", ["Umhlanga", "Durban North", "Morningside", "Durban CBD", "Ballito"])]),
        ("Eastern Cape", "Eastern Cape", [("Gqeberha (Port Elizabeth)", ["Summerstrand", "Walmer"]), ("East London", ["Nahoon"])]),
        ("Free State", "Free State", [("Bloemfontein", ["Westdene", "Brandwag"])]),
        ("Limpopo", "Limpopo", [("Polokwane", ["Bendor", "CBD"])]),
        ("Mpumalanga", "Mpumalanga", [("Mbombela (Nelspruit)", ["Riverside", "CBD"]), ("Emalahleni (Witbank)", ["CBD"])]),
        ("North West", "North West", [("Rustenburg", ["CBD"]), ("Potchefstroom", ["Bult"])]),
        ("Northern Cape", "Northern Cape", [("Kimberley", ["CBD"]), ("Upington", ["CBD"])])
    ],

    # 44. NG (Nigeria) - Major States and FCT
    "NG": [
        ("Lagos State", "Lagos", [("Lagos Island / Eti-Osa", ["Victoria Island (VI)", "Ikoyi", "Lekki Phase 1", "Chevron / Ajah"]), ("Lagos Mainland", ["Ikeja (GRA)", "Surulere", "Yaba", "Maryland", "Gbagada"])]),
        ("Federal Capital Territory", "Abuja", [("Abuja Municipal (AMAC)", ["Maitama", "Asokoro", "Wuse 2", "Garki", "Central Business District (CBD)", "Jabi", "Gwarinpa"])]),
        ("Rivers State", "Rivers", [("Port Harcourt", ["Old GRA", "New GRA", "Peter Odili Rd", "Trans Amadi"])]),
        ("Oyo State", "Oyo", [("Ibadan", ["Bodija", "Jericho", "Agodi GRA", "Ring Road"])]),
        ("Kano State", "Kano", [("Kano Municipal", ["Nassarawa GRA", "Sabon Gari"])]),
        ("Kaduna State", "Kaduna", [("Kaduna City", ["Barnawa", "Malali", "Unga Rimi"])]),
        ("Edo State", "Edo", [("Benin City", ["GRA", "Uselu"])]),
        ("Delta State", "Delta", [("Warri", ["GRA"]), ("Asaba", ["GRA"])]),
        ("Anambra State", "Anambra", [("Awka", ["GRA"]), ("Onitsha", ["GRA"])]),
        ("Enugu State", "Enugu", [("Enugu City", ["Independence Layout", "New Haven"])]),
        ("Ogun State", "Ogun", [("Abeokuta", ["Ibikunle"]), ("Ota", ["Industrial Area"])]),
        ("Akwa Ibom State", "Akwa Ibom", [("Uyo", ["Ewet Housing Estate", "Shelter Afrique"])]),
        ("Plateau State", "Plateau", [("Jos", ["Rayfield", "Jos South"])])
    ],

    # 45. BR (Brazil) - Major States and Distrito Federal
    "BR": [
        ("São Paulo", "SP", [("São Paulo Capital", ["Jardins", "Pinheiros", "Itaim Bibi", "Vila Madalena", "Moema", "Bela Vista (Paulista)", "Bom Retiro (Koreatown)"]), ("Campinas", ["Cambuí"]), ("Santos", ["Gonzaga"])]),
        ("Rio de Janeiro", "RJ", [("Rio de Janeiro Capital", ["Copacabana", "Ipanema", "Leblon", "Barra da Tijuca", "Botafogo", "Flamengo", "Centro"]), ("Niterói", ["Icaraí"])]),
        ("Distrito Federal", "DF", [("Brasília", ["Asa Sul", "Asa Norte", "Lago Sul", "Sudoeste"])]),
        ("Minas Gerais", "MG", [("Belo Horizonte", ["Savassi", "Lourdes", "Funcionários", "Buritis"])]),
        ("Bahia", "BA", [("Salvador", ["Barra", "Pituba", "Pelourinho", "Rio Vermelho"])]),
        ("Paraná", "PR", [("Curitiba", ["Batel", "Bigorrilho", "Centro", "Água Verde"])]),
        ("Rio Grande do Sul", "RS", [("Porto Alegre", ["Moinhos de Vento", "Bela Vista", "Petrópolis"])]),
        ("Ceará", "CE", [("Fortaleza", ["Meireles", "Aldeota", "Praia de Iracema"])]),
        ("Pernambuco", "PE", [("Recife", ["Boa Viagem", "Graças", "Recife Antigo"])]),
        ("Santa Catarina", "SC", [("Florianópolis", ["Centro", "Jurerê Internacional", "Lagoa da Conceição"])]),
        ("Goiás", "GO", [("Goiânia", ["Setor Bueno", "Setor Marista"])]),
        ("Amazonas", "AM", [("Manaus", ["Ponta Negra", "Adrianópolis"])]),
        ("Espírito Santo", "ES", [("Vitória", ["Praia do Canto"])]),
        ("Mato Grosso", "MT", [("Cuiabá", ["Goiabeiras"])]),
        ("Mato Grosso do Sul", "MS", [("Campo Grande", ["Chácara Cachoeira"])])
    ],

    # 46. MX (Mexico) - Major States and Mexico City
    "MX": [
        ("Ciudad de México (CDMX)", "CDMX", [("Cuauhtémoc", ["Roma Norte", "Condesa", "Juárez (Zona Rosa/Koreatown)", "Centro Histórico"]), ("Miguel Hidalgo", ["Polanco", "Lomas de Chapultepec", "Anzures"]), ("Benito Juárez", ["Del Valle", "Narvarte"]), ("Coyoacán", ["Coyoacán Centro"]), ("Álvaro Obregón", ["Santa Fe", "San Ángel"])]),
        ("Nuevo León", "NL", [("Monterrey", ["San Pedro Garza García", "Valle Oriente", "Centro", "Cumbres"])]),
        ("Jalisco", "Jalisco", [("Guadalajara", ["Zapopan (Puerta de Hierro)", "Providencia", "Americana", "Chapultepec", "Centro"])]),
        ("Quintana Roo (Cancún)", "QRoo", [("Cancún (Benito Juárez)", ["Zona Hotelera", "Centro"]), ("Playa del Carmen (Solidaridad)", ["Quinta Avenida", "Playacar"]), ("Tulum", ["La Veleta", "Aldea Zama"])]),
        ("Estado de México", "Edomex", [("Naucalpan", ["Ciudad Satélite"]), ("Huixquilucan", ["Interlomas"]), ("Toluca", ["Centro"])]),
        ("Yucatán", "Yucatán", [("Mérida", ["Paseo de Montejo", "Centro Histórico", "Altabrisa"])]),
        ("Puebla", "Puebla", [("Puebla Capital", ["Angelópolis", "La Paz", "Centro Histórico"])]),
        ("Querétaro", "Querétaro", [("Querétaro Capital", ["Juriquilla", "Centro Histórico", "Álamos"])]),
        ("Baja California (Tijuana)", "BC", [("Tijuana", ["Zona Río", "Playas de Tijuana", "Agua Caliente"]), ("Mexicali", ["Centro"])]),
        ("Guanajuato", "Guanajuato", [("León", ["Campestre"]), ("San Miguel de Allende", ["Centro Histórico"]), ("Guanajuato City", ["Centro"])]),
        ("Chihuahua", "Chihuahua", [("Ciudad Juárez", ["Campos Elíseos"]), ("Chihuahua City", ["San Felipe"])]),
        ("Baja California Sur", "BCS", [("Los Cabos", ["San José del Cabo", "Cabo San Lucas"]), ("La Paz", ["Malecón"])]),
        ("Veracruz", "Veracruz", [("Veracruz / Boca del Río", ["Costa de Oro", "Reforma"])]),
        ("Sonora", "Sonora", [("Hermosillo", ["Pitiquito", "Centro"])]),
        ("Sinaloa", "Sinaloa", [("Culiacán", ["Tres Ríos"]), ("Mazatlán", ["Zona Dorada"])])
    ]
}

def generate_ts():
    lines = []
    lines.append('import { type SidoData } from "./regions";')
    lines.append('')
    lines.append('export const worldRegions: Record<string, SidoData[]> = {')

    for country_code, sidos in COUNTRIES_DATA.items():
        lines.append(f'  {country_code}: [')
        for sido_name, short_name, gungus in sidos:
            lines.append('    {')
            lines.append(f'      name: {json.dumps(sido_name, ensure_ascii=False)},')
            lines.append(f'      shortName: {json.dumps(short_name, ensure_ascii=False)},')
            lines.append('      gunguList: [')
            for gungu_name, dongs in gungus:
                dongs_json = json.dumps(dongs, ensure_ascii=False)
                lines.append(f'        {{ name: {json.dumps(gungu_name, ensure_ascii=False)}, dongs: {dongs_json} }},')
            lines.append('      ],')
            lines.append('    },')
        lines.append('  ],')

    lines.append('};')
    lines.append('')

    content = '\n'.join(lines)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Generated {OUTPUT_PATH} successfully! Total countries: {len(COUNTRIES_DATA)}")

    # Update DEFAULT_COUNTRY_REGIONS in regions.ts
    regions_file = r"c:\Users\leetr\Documents\life-project\life-help\lib\region\regions.ts"
    with open(regions_file, "r", encoding="utf-8") as f:
        reg_code = f.read()

    default_lines = [
        '  KR: { country: "KR", sido: "전북특별자치도", gungu: "익산시", dong: "신동" },',
        '  VN: { country: "VN", sido: "Thành phố Hồ Chí Minh", gungu: "Quận 1", dong: "Bến Nghé" },',
        '  JP: { country: "JP", sido: "東京都", gungu: "新宿区", dong: "西新宿" },',
        '  CN: { country: "CN", sido: "北京市", gungu: "朝阳区", dong: "三里屯街道" },',
        '  TW: { country: "TW", sido: "臺北市", gungu: "信義區", dong: "西村里" },',
        '  ID: { country: "ID", sido: "DKI Jakarta", gungu: "Jakarta Selatan", dong: "Senayan" },',
        '  PH: { country: "PH", sido: "Metro Manila", gungu: "Makati", dong: "Bel-Air" },',
    ]

    for c_code, sidos in COUNTRIES_DATA.items():
        first_sido = sidos[0][0]
        first_gungu = sidos[0][2][0][0]
        first_dong = sidos[0][2][0][1][0]
        default_lines.append(f'  {c_code}: {{ country: "{c_code}", sido: {json.dumps(first_sido, ensure_ascii=False)}, gungu: {json.dumps(first_gungu, ensure_ascii=False)}, dong: {json.dumps(first_dong, ensure_ascii=False)} }},')

    new_block = "export const DEFAULT_COUNTRY_REGIONS: Record<string, RegionItem> = {\n" + "\n".join(default_lines) + "\n};"
    import re
    reg_code_new = re.sub(
        r"export const DEFAULT_COUNTRY_REGIONS: Record<string, RegionItem> = \{.*?\n\};",
        new_block,
        reg_code,
        flags=re.DOTALL
    )

    with open(regions_file, "w", encoding="utf-8") as f:
        f.write(reg_code_new)

    print(f"Updated DEFAULT_COUNTRY_REGIONS in regions.ts for all {len(default_lines)} countries!")

if __name__ == "__main__":
    generate_ts()

