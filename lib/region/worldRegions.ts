import { type SidoData } from "./regions";

export const worldRegions: Record<string, SidoData[]> = {
  US: [
    {
      name: "California",
      shortName: "CA",
      gunguList: [
        { name: "Los Angeles", dongs: ["Koreatown", "Downtown", "Hollywood", "Westwood", "Silver Lake"] },
        { name: "Orange County", dongs: ["Irvine", "Fullerton", "Buena Park", "Anaheim", "Garden Grove"] },
        { name: "San Francisco", dongs: ["Financial District", "Mission", "Sunset", "Richmond"] },
        { name: "San Diego", dongs: ["Downtown", "La Jolla", "Pacific Beach"] },
        { name: "San Jose", dongs: ["Downtown", "North San Jose", "Willow Glen"] },
      ],
    },
    {
      name: "New York",
      shortName: "NY",
      gunguList: [
        { name: "New York City (Manhattan)", dongs: ["Midtown", "Koreatown (32nd St)", "Lower East Side", "Upper West Side"] },
        { name: "Queens", dongs: ["Flushing", "Bayside", "Astoria", "Long Island City"] },
        { name: "Brooklyn", dongs: ["Williamsburg", "DUMBO", "Brooklyn Heights"] },
        { name: "Bronx", dongs: ["Riverdale", "Pelham Bay"] },
        { name: "Staten Island", dongs: ["St. George", "Todt Hill"] },
      ],
    },
    {
      name: "Texas",
      shortName: "TX",
      gunguList: [
        { name: "Dallas", dongs: ["Carrollton", "Downtown", "Plano", "Frisco"] },
        { name: "Houston", dongs: ["Downtown", "Spring Branch", "Memorial", "Katy"] },
        { name: "Austin", dongs: ["Downtown", "Domain", "South Congress"] },
        { name: "San Antonio", dongs: ["Downtown", "Alamo Heights"] },
      ],
    },
    {
      name: "Washington",
      shortName: "WA",
      gunguList: [
        { name: "Seattle", dongs: ["Downtown", "Capitol Hill", "Ballard", "University District"] },
        { name: "Bellevue", dongs: ["Downtown", "Factoria"] },
        { name: "Tacoma", dongs: ["Downtown", "North End"] },
      ],
    },
    {
      name: "Illinois",
      shortName: "IL",
      gunguList: [
        { name: "Chicago", dongs: ["The Loop", "Lincoln Park", "West Loop", "River North", "Hyde Park"] },
        { name: "Cook County Suburbs", dongs: ["Glenview", "Schaumburg", "Evanston", "Naperville"] },
      ],
    },
    {
      name: "New Jersey",
      shortName: "NJ",
      gunguList: [
        { name: "Bergen County", dongs: ["Fort Lee", "Palisades Park", "Englewood", "Paramus", "Tenafly"] },
        { name: "Hudson County", dongs: ["Jersey City", "Hoboken"] },
        { name: "Middlesex County", dongs: ["Edison", "New Brunswick"] },
      ],
    },
    {
      name: "Georgia",
      shortName: "GA",
      gunguList: [
        { name: "Atlanta", dongs: ["Buckhead", "Midtown", "Downtown"] },
        { name: "Gwinnett County", dongs: ["Duluth", "Suwanee", "Buford", "Lawrenceville"] },
      ],
    },
    {
      name: "Virginia",
      shortName: "VA",
      gunguList: [
        { name: "Fairfax County", dongs: ["Annandale", "Centreville", "Tysons", "Vienna", "McLean"] },
        { name: "Arlington", dongs: ["Rosslyn", "Crystal City"] },
        { name: "Richmond", dongs: ["Downtown", "The Fan"] },
      ],
    },
    {
      name: "Florida",
      shortName: "FL",
      gunguList: [
        { name: "Miami", dongs: ["Brickell", "South Beach", "Downtown", "Coral Gables"] },
        { name: "Orlando", dongs: ["Downtown", "Lake Nona", "Winter Park"] },
        { name: "Tampa", dongs: ["Downtown", "Ybor City"] },
      ],
    },
    {
      name: "Pennsylvania",
      shortName: "PA",
      gunguList: [
        { name: "Philadelphia", dongs: ["Center City", "University City", "Old City", "Cheltenham"] },
        { name: "Pittsburgh", dongs: ["Downtown", "Oakland", "Shadyside"] },
      ],
    },
    {
      name: "Massachusetts",
      shortName: "MA",
      gunguList: [
        { name: "Boston", dongs: ["Back Bay", "Downtown", "Beacon Hill", "South End"] },
        { name: "Cambridge", dongs: ["Harvard Square", "Kendall Square"] },
        { name: "Brookline", dongs: ["Coolidge Corner"] },
      ],
    },
    {
      name: "North Carolina",
      shortName: "NC",
      gunguList: [
        { name: "Charlotte", dongs: ["Uptown", "South End", "Ballantyne"] },
        { name: "Raleigh", dongs: ["Downtown", "North Hills"] },
        { name: "Durham", dongs: ["Downtown", "Research Triangle"] },
      ],
    },
    {
      name: "Michigan",
      shortName: "MI",
      gunguList: [
        { name: "Detroit", dongs: ["Downtown", "Midtown"] },
        { name: "Oakland County", dongs: ["Troy", "Novi", "Ann Arbor"] },
      ],
    },
    {
      name: "Ohio",
      shortName: "OH",
      gunguList: [
        { name: "Columbus", dongs: ["Downtown", "Short North", "Dublin"] },
        { name: "Cleveland", dongs: ["Downtown", "University Circle"] },
        { name: "Cincinnati", dongs: ["Downtown", "Over-the-Rhine"] },
      ],
    },
    {
      name: "Colorado",
      shortName: "CO",
      gunguList: [
        { name: "Denver", dongs: ["Downtown", "LoDo", "Cherry Creek"] },
        { name: "Aurora", dongs: ["Havana District"] },
        { name: "Boulder", dongs: ["Pearl Street"] },
      ],
    },
    {
      name: "Arizona",
      shortName: "AZ",
      gunguList: [
        { name: "Phoenix", dongs: ["Downtown", "Midtown"] },
        { name: "Maricopa County", dongs: ["Scottsdale", "Tempe", "Chandler", "Mesa"] },
      ],
    },
    {
      name: "Nevada",
      shortName: "NV",
      gunguList: [
        { name: "Las Vegas", dongs: ["The Strip", "Spring Mountain (Chinatown)", "Summerlin", "Henderson"] },
      ],
    },
    {
      name: "Maryland",
      shortName: "MD",
      gunguList: [
        { name: "Montgomery County", dongs: ["Bethesda", "Rockville", "Silver Spring"] },
        { name: "Howard County", dongs: ["Ellicott City", "Columbia"] },
      ],
    },
    {
      name: "District of Columbia",
      shortName: "DC",
      gunguList: [
        { name: "Washington D.C.", dongs: ["Georgetown", "Dupont Circle", "Capitol Hill", "Foggy Bottom", "Adams Morgan"] },
      ],
    },
    {
      name: "Alabama",
      shortName: "AL",
      gunguList: [
        { name: "Birmingham", dongs: ["Downtown", "Five Points South"] },
        { name: "Huntsville", dongs: ["Downtown", "Madison"] },
        { name: "Mobile", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Alaska",
      shortName: "AK",
      gunguList: [
        { name: "Anchorage", dongs: ["Downtown", "Midtown"] },
        { name: "Fairbanks", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Arkansas",
      shortName: "AR",
      gunguList: [
        { name: "Little Rock", dongs: ["Downtown", "River Market"] },
        { name: "Northwest Arkansas", dongs: ["Bentonville", "Fayetteville"] },
      ],
    },
    {
      name: "Connecticut",
      shortName: "CT",
      gunguList: [
        { name: "Fairfield County", dongs: ["Stamford", "Greenwich"] },
        { name: "New Haven", dongs: ["Downtown", "Yale Area"] },
        { name: "Hartford", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Delaware",
      shortName: "DE",
      gunguList: [
        { name: "New Castle County", dongs: ["Wilmington", "Newark"] },
        { name: "Kent County", dongs: ["Dover"] },
      ],
    },
    {
      name: "Hawaii",
      shortName: "HI",
      gunguList: [
        { name: "Honolulu (Oahu)", dongs: ["Waikiki", "Ala Moana", "Downtown", "Kaimuki", "Manoa"] },
        { name: "Maui", dongs: ["Kahului", "Lahaina"] },
        { name: "Hawaii (Big Island)", dongs: ["Hilo", "Kailua-Kona"] },
      ],
    },
    {
      name: "Idaho",
      shortName: "ID",
      gunguList: [
        { name: "Boise", dongs: ["Downtown", "North End"] },
        { name: "Ada County", dongs: ["Meridian", "Eagle"] },
      ],
    },
    {
      name: "Indiana",
      shortName: "IN",
      gunguList: [
        { name: "Indianapolis", dongs: ["Downtown", "Broad Ripple", "Carmel", "Fishers"] },
        { name: "Bloomington", dongs: ["IU Campus"] },
      ],
    },
    {
      name: "Iowa",
      shortName: "IA",
      gunguList: [
        { name: "Des Moines", dongs: ["Downtown", "East Village"] },
        { name: "Iowa City", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Kansas",
      shortName: "KS",
      gunguList: [
        { name: "Kansas City Area", dongs: ["Overland Park", "Olathe"] },
        { name: "Wichita", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Kentucky",
      shortName: "KY",
      gunguList: [
        { name: "Louisville", dongs: ["Downtown", "Highlands"] },
        { name: "Lexington", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Louisiana",
      shortName: "LA",
      gunguList: [
        { name: "New Orleans", dongs: ["French Quarter", "Garden District", "CBD"] },
        { name: "Baton Rouge", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Maine",
      shortName: "ME",
      gunguList: [
        { name: "Portland", dongs: ["Old Port", "Downtown"] },
        { name: "Bangor", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Minnesota",
      shortName: "MN",
      gunguList: [
        { name: "Minneapolis", dongs: ["Downtown", "Uptown", "Northeast"] },
        { name: "Saint Paul", dongs: ["Downtown", "Highland Park"] },
      ],
    },
    {
      name: "Mississippi",
      shortName: "MS",
      gunguList: [
        { name: "Jackson", dongs: ["Downtown", "Fondren"] },
        { name: "Gulfport", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Missouri",
      shortName: "MO",
      gunguList: [
        { name: "St. Louis", dongs: ["Downtown", "Central West End"] },
        { name: "Kansas City", dongs: ["Country Club Plaza", "Downtown"] },
      ],
    },
    {
      name: "Montana",
      shortName: "MT",
      gunguList: [
        { name: "Billings", dongs: ["Downtown"] },
        { name: "Bozeman", dongs: ["Downtown"] },
        { name: "Missoula", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Nebraska",
      shortName: "NE",
      gunguList: [
        { name: "Omaha", dongs: ["Old Market", "Downtown"] },
        { name: "Lincoln", dongs: ["Downtown"] },
      ],
    },
    {
      name: "New Hampshire",
      shortName: "NH",
      gunguList: [
        { name: "Manchester", dongs: ["Downtown"] },
        { name: "Nashua", dongs: ["Downtown"] },
      ],
    },
    {
      name: "New Mexico",
      shortName: "NM",
      gunguList: [
        { name: "Albuquerque", dongs: ["Downtown", "Nob Hill"] },
        { name: "Santa Fe", dongs: ["Historic Plaza"] },
      ],
    },
    {
      name: "North Dakota",
      shortName: "ND",
      gunguList: [
        { name: "Fargo", dongs: ["Downtown"] },
        { name: "Bismarck", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Oklahoma",
      shortName: "OK",
      gunguList: [
        { name: "Oklahoma City", dongs: ["Bricktown", "Downtown"] },
        { name: "Tulsa", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Oregon",
      shortName: "OR",
      gunguList: [
        { name: "Portland", dongs: ["Pearl District", "Downtown", "Hawthorne"] },
        { name: "Beaverton", dongs: ["Central"] },
      ],
    },
    {
      name: "Rhode Island",
      shortName: "RI",
      gunguList: [
        { name: "Providence", dongs: ["College Hill", "Downtown", "Federal Hill"] },
        { name: "Newport", dongs: ["Historic Downtown"] },
      ],
    },
    {
      name: "South Carolina",
      shortName: "SC",
      gunguList: [
        { name: "Charleston", dongs: ["Historic District", "Downtown"] },
        { name: "Columbia", dongs: ["Downtown"] },
        { name: "Greenville", dongs: ["Downtown"] },
      ],
    },
    {
      name: "South Dakota",
      shortName: "SD",
      gunguList: [
        { name: "Sioux Falls", dongs: ["Downtown"] },
        { name: "Rapid City", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Tennessee",
      shortName: "TN",
      gunguList: [
        { name: "Nashville", dongs: ["Downtown", "The Gulch", "Music Row"] },
        { name: "Memphis", dongs: ["Downtown", "Midtown"] },
        { name: "Knoxville", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Utah",
      shortName: "UT",
      gunguList: [
        { name: "Salt Lake City", dongs: ["Downtown", "Sugar House"] },
        { name: "Utah County", dongs: ["Provo", "Orem"] },
      ],
    },
    {
      name: "Vermont",
      shortName: "VT",
      gunguList: [
        { name: "Burlington", dongs: ["Church Street", "Downtown"] },
        { name: "Montpelier", dongs: ["State Street"] },
      ],
    },
    {
      name: "West Virginia",
      shortName: "WV",
      gunguList: [
        { name: "Charleston", dongs: ["Downtown"] },
        { name: "Morgantown", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Wisconsin",
      shortName: "WI",
      gunguList: [
        { name: "Milwaukee", dongs: ["Downtown", "Third Ward"] },
        { name: "Madison", dongs: ["Capitol Square", "State Street"] },
      ],
    },
    {
      name: "Wyoming",
      shortName: "WY",
      gunguList: [
        { name: "Cheyenne", dongs: ["Downtown"] },
        { name: "Casper", dongs: ["Downtown"] },
        { name: "Jackson", dongs: ["Town Square"] },
      ],
    },
  ],
  CA: [
    {
      name: "Ontario",
      shortName: "ON",
      gunguList: [
        { name: "Toronto", dongs: ["Downtown", "North York", "Scarborough", "Etobicoke", "Yorkville"] },
        { name: "Ottawa", dongs: ["Centretown", "ByWard Market", "Kanata"] },
        { name: "Mississauga", dongs: ["City Centre", "Port Credit"] },
      ],
    },
    {
      name: "Quebec",
      shortName: "QC",
      gunguList: [
        { name: "Montreal", dongs: ["Downtown", "Plateau-Mont-Royal", "Old Montreal", "Côte-des-Neiges"] },
        { name: "Quebec City", dongs: ["Old Quebec", "Sainte-Foy"] },
      ],
    },
    {
      name: "British Columbia",
      shortName: "BC",
      gunguList: [
        { name: "Vancouver", dongs: ["Downtown", "West End", "Kitsilano", "Yaletown", "Kerrisdale"] },
        { name: "Richmond", dongs: ["City Centre", "Steveston"] },
        { name: "Burnaby", dongs: ["Metrotown", "Brentwood"] },
        { name: "Surrey", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Alberta",
      shortName: "AB",
      gunguList: [
        { name: "Calgary", dongs: ["Downtown", "Beltline", "Kensington"] },
        { name: "Edmonton", dongs: ["Downtown", "Strathcona"] },
      ],
    },
    {
      name: "Manitoba",
      shortName: "MB",
      gunguList: [
        { name: "Winnipeg", dongs: ["Downtown", "Exchange District", "Osborne Village"] },
      ],
    },
    {
      name: "Saskatchewan",
      shortName: "SK",
      gunguList: [
        { name: "Saskatoon", dongs: ["Downtown", "Nutana"] },
        { name: "Regina", dongs: ["Downtown"] },
      ],
    },
    {
      name: "Nova Scotia",
      shortName: "NS",
      gunguList: [
        { name: "Halifax", dongs: ["Downtown", "South End", "Dartmouth"] },
      ],
    },
    {
      name: "New Brunswick",
      shortName: "NB",
      gunguList: [
        { name: "Fredericton", dongs: ["Downtown"] },
        { name: "Moncton", dongs: ["Downtown"] },
        { name: "Saint John", dongs: ["Uptown"] },
      ],
    },
    {
      name: "Newfoundland and Labrador",
      shortName: "NL",
      gunguList: [
        { name: "St. John's", dongs: ["Downtown", "Quidi Vidi"] },
      ],
    },
    {
      name: "Prince Edward Island",
      shortName: "PE",
      gunguList: [
        { name: "Charlottetown", dongs: ["Downtown", "Waterfront"] },
      ],
    },
    {
      name: "Northwest Territories",
      shortName: "NT",
      gunguList: [
        { name: "Yellowknife", dongs: ["Downtown", "Old Town"] },
      ],
    },
    {
      name: "Yukon",
      shortName: "YT",
      gunguList: [
        { name: "Whitehorse", dongs: ["Downtown", "Riverdale"] },
      ],
    },
    {
      name: "Nunavut",
      shortName: "NU",
      gunguList: [
        { name: "Iqaluit", dongs: ["Apex", "Happy Valley"] },
      ],
    },
  ],
  GB: [
    {
      name: "Greater London",
      shortName: "London",
      gunguList: [
        { name: "Central London", dongs: ["Westminster", "City of London", "Camden", "Kensington", "Soho"] },
        { name: "South London", dongs: ["New Malden (Koreatown)", "Kingston", "Wimbledon", "Richmond"] },
        { name: "East London", dongs: ["Canary Wharf", "Stratford", "Shoreditch"] },
        { name: "North London", dongs: ["Islington", "Barnet", "Finchley"] },
      ],
    },
    {
      name: "South East",
      shortName: "South East",
      gunguList: [
        { name: "Surrey", dongs: ["Guildford", "Woking"] },
        { name: "Oxfordshire", dongs: ["Oxford City"] },
        { name: "Berkshire", dongs: ["Reading", "Slough", "Windsor"] },
        { name: "Brighton and Hove", dongs: ["Brighton"] },
      ],
    },
    {
      name: "North West",
      shortName: "North West",
      gunguList: [
        { name: "Greater Manchester", dongs: ["Manchester City Centre", "Salford", "Didsbury", "Trafford"] },
        { name: "Merseyside", dongs: ["Liverpool City Centre", "Albert Dock"] },
      ],
    },
    {
      name: "West Midlands",
      shortName: "West Midlands",
      gunguList: [
        { name: "Birmingham", dongs: ["City Centre", "Edgbaston", "Jewellery Quarter", "Solihull"] },
        { name: "Coventry", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Scotland",
      shortName: "Scotland",
      gunguList: [
        { name: "Edinburgh", dongs: ["Old Town", "New Town", "Leith"] },
        { name: "Glasgow", dongs: ["City Centre", "West End", "Southside"] },
        { name: "Aberdeen", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Wales",
      shortName: "Wales",
      gunguList: [
        { name: "Cardiff", dongs: ["City Centre", "Cardiff Bay", "Cathays"] },
        { name: "Swansea", dongs: ["Marina", "City Centre"] },
      ],
    },
    {
      name: "Northern Ireland",
      shortName: "N. Ireland",
      gunguList: [
        { name: "Belfast", dongs: ["City Centre", "Cathedral Quarter", "Titanic Quarter"] },
        { name: "Derry / Londonderry", dongs: ["Cityside"] },
      ],
    },
    {
      name: "Yorkshire and the Humber",
      shortName: "Yorkshire",
      gunguList: [
        { name: "Leeds", dongs: ["City Centre", "Headingley"] },
        { name: "Sheffield", dongs: ["City Centre", "Broomhill"] },
        { name: "York", dongs: ["City Centre"] },
      ],
    },
    {
      name: "South West",
      shortName: "South West",
      gunguList: [
        { name: "Bristol", dongs: ["Harbourside", "Clifton", "City Centre"] },
        { name: "Bath", dongs: ["City Centre"] },
        { name: "Plymouth", dongs: ["City Centre"] },
      ],
    },
    {
      name: "East of England",
      shortName: "East",
      gunguList: [
        { name: "Cambridgeshire", dongs: ["Cambridge City", "Peterborough"] },
        { name: "Hertfordshire", dongs: ["Watford", "St Albans"] },
        { name: "Essex", dongs: ["Chelmsford", "Colchester"] },
      ],
    },
    {
      name: "East Midlands",
      shortName: "East Mid.",
      gunguList: [
        { name: "Nottingham", dongs: ["City Centre", "Lace Market"] },
        { name: "Leicester", dongs: ["City Centre"] },
        { name: "Derby", dongs: ["City Centre"] },
      ],
    },
    {
      name: "North East",
      shortName: "North East",
      gunguList: [
        { name: "Newcastle upon Tyne", dongs: ["City Centre", "Quayside", "Jesmond"] },
        { name: "Sunderland", dongs: ["City Centre"] },
      ],
    },
  ],
  AU: [
    {
      name: "New South Wales",
      shortName: "NSW",
      gunguList: [
        { name: "Sydney Inner", dongs: ["Sydney CBD", "Surry Hills", "Pyrmont", "Haymarket"] },
        { name: "Sydney North / West", dongs: ["Eastwood", "Strathfield", "Chatswood", "Parramatta", "Epping"] },
        { name: "Sydney South", dongs: ["Hurstville", "Kogarah"] },
      ],
    },
    {
      name: "Victoria",
      shortName: "VIC",
      gunguList: [
        { name: "Melbourne Inner", dongs: ["Melbourne CBD", "Docklands", "Southbank", "Carlton"] },
        { name: "Melbourne East / South", dongs: ["Box Hill", "Glen Waverley", "Clayton", "South Yarra", "St Kilda"] },
      ],
    },
    {
      name: "Queensland",
      shortName: "QLD",
      gunguList: [
        { name: "Brisbane", dongs: ["Brisbane CBD", "South Brisbane", "Fortitude Valley", "Sunnybank"] },
        { name: "Gold Coast", dongs: ["Surfers Paradise", "Southport", "Broadbeach"] },
        { name: "Cairns", dongs: ["Cairns City"] },
      ],
    },
    {
      name: "Western Australia",
      shortName: "WA",
      gunguList: [
        { name: "Perth", dongs: ["Perth CBD", "Northbridge", "Subiaco", "Fremantle", "Cannington"] },
      ],
    },
    {
      name: "South Australia",
      shortName: "SA",
      gunguList: [
        { name: "Adelaide", dongs: ["Adelaide CBD", "North Adelaide", "Norwood", "Glenelg"] },
      ],
    },
    {
      name: "Tasmania",
      shortName: "TAS",
      gunguList: [
        { name: "Hobart", dongs: ["Hobart CBD", "Battery Point", "Sandy Bay"] },
        { name: "Launceston", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Australian Capital Territory",
      shortName: "ACT",
      gunguList: [
        { name: "Canberra", dongs: ["Civic (City)", "Braddon", "Belconnen", "Barton"] },
      ],
    },
    {
      name: "Northern Territory",
      shortName: "NT",
      gunguList: [
        { name: "Darwin", dongs: ["Darwin City", "Cullen Bay"] },
        { name: "Alice Springs", dongs: ["Town Centre"] },
      ],
    },
  ],
  NZ: [
    {
      name: "Auckland Region",
      shortName: "Auckland",
      gunguList: [
        { name: "Central Auckland", dongs: ["Auckland CBD", "Ponsonby", "Newmarket", "Parnell"] },
        { name: "North Shore", dongs: ["Albany", "Takapuna", "Browns Bay"] },
        { name: "East Auckland", dongs: ["Howick", "Pakuranga"] },
      ],
    },
    {
      name: "Wellington Region",
      shortName: "Wellington",
      gunguList: [
        { name: "Wellington City", dongs: ["Wellington CBD", "Te Aro", "Thorndon", "Oriental Bay"] },
        { name: "Lower Hutt", dongs: ["Hutt Central"] },
      ],
    },
    {
      name: "Canterbury",
      shortName: "Canterbury",
      gunguList: [
        { name: "Christchurch", dongs: ["Christchurch Central", "Riccarton", "Merivale", "Fendalton"] },
      ],
    },
    {
      name: "Waikato",
      shortName: "Waikato",
      gunguList: [
        { name: "Hamilton", dongs: ["Hamilton Central", "Rototuna"] },
        { name: "Taupo", dongs: ["Taupo Central"] },
      ],
    },
    {
      name: "Bay of Plenty",
      shortName: "Bay of Plenty",
      gunguList: [
        { name: "Tauranga", dongs: ["Mount Maunganui", "Tauranga Central"] },
        { name: "Rotorua", dongs: ["Central"] },
      ],
    },
    {
      name: "Otago",
      shortName: "Otago",
      gunguList: [
        { name: "Queenstown Lakes", dongs: ["Queenstown Central", "Frankton", "Wanaka"] },
        { name: "Dunedin", dongs: ["Dunedin Central"] },
      ],
    },
    {
      name: "Hawke's Bay",
      shortName: "Hawke's Bay",
      gunguList: [
        { name: "Napier", dongs: ["Napier South"] },
        { name: "Hastings", dongs: ["Hastings Central"] },
      ],
    },
    {
      name: "Manawatū-Whanganui",
      shortName: "Manawatū",
      gunguList: [
        { name: "Palmerston North", dongs: ["City Centre"] },
        { name: "Whanganui", dongs: ["Central"] },
      ],
    },
    {
      name: "Northland",
      shortName: "Northland",
      gunguList: [
        { name: "Whangarei", dongs: ["Central"] },
        { name: "Far North", dongs: ["Kerikeri"] },
      ],
    },
    {
      name: "Taranaki",
      shortName: "Taranaki",
      gunguList: [
        { name: "New Plymouth", dongs: ["Central"] },
      ],
    },
    {
      name: "Nelson",
      shortName: "Nelson",
      gunguList: [
        { name: "Nelson City", dongs: ["Nelson Central"] },
      ],
    },
    {
      name: "Tasman",
      shortName: "Tasman",
      gunguList: [
        { name: "Richmond", dongs: ["Richmond Central"] },
      ],
    },
    {
      name: "Marlborough",
      shortName: "Marlborough",
      gunguList: [
        { name: "Blenheim", dongs: ["Blenheim Central"] },
      ],
    },
    {
      name: "Southland",
      shortName: "Southland",
      gunguList: [
        { name: "Invercargill", dongs: ["Invercargill Central"] },
      ],
    },
    {
      name: "Gisborne",
      shortName: "Gisborne",
      gunguList: [
        { name: "Gisborne City", dongs: ["Gisborne Central"] },
      ],
    },
    {
      name: "West Coast",
      shortName: "West Coast",
      gunguList: [
        { name: "Greymouth", dongs: ["Greymouth Central"] },
      ],
    },
  ],
  DE: [
    {
      name: "Berlin",
      shortName: "Berlin",
      gunguList: [
        { name: "Mitte", dongs: ["Alexanderplatz", "Tiergarten", "Wedding"] },
        { name: "Charlottenburg-Wilmersdorf", dongs: ["Charlottenburg", "Ku'damm", "Wilmersdorf"] },
        { name: "Friedrichshain-Kreuzberg", dongs: ["Kreuzberg", "Friedrichshain"] },
        { name: "Pankow", dongs: ["Prenzlauer Berg"] },
      ],
    },
    {
      name: "Bayern (Bavaria)",
      shortName: "Bayern",
      gunguList: [
        { name: "München (Munich)", dongs: ["Altstadt", "Schwabing", "Maxvorstadt", "Bogenhausen"] },
        { name: "Nürnberg (Nuremberg)", dongs: ["Altstadt"] },
        { name: "Augsburg", dongs: ["Innenstadt"] },
      ],
    },
    {
      name: "Hessen",
      shortName: "Hessen",
      gunguList: [
        { name: "Frankfurt am Main", dongs: ["Innenstadt", "Sachsenhausen", "Westend", "Eschborn", "Nordend"] },
        { name: "Wiesbaden", dongs: ["Mitte"] },
        { name: "Darmstadt", dongs: ["Mitte"] },
      ],
    },
    {
      name: "Nordrhein-Westfalen",
      shortName: "NRW",
      gunguList: [
        { name: "Düsseldorf", dongs: ["Altstadt", "Stadtmitte (Little Tokyo)", "Oberkassel"] },
        { name: "Köln (Cologne)", dongs: ["Innenstadt", "Ehrenfeld", "Deutz"] },
        { name: "Essen", dongs: ["Stadtkern"] },
        { name: "Dortmund", dongs: ["Innenstadt"] },
      ],
    },
    {
      name: "Baden-Württemberg",
      shortName: "BW",
      gunguList: [
        { name: "Stuttgart", dongs: ["Mitte", "Bad Cannstatt"] },
        { name: "Karlsruhe", dongs: ["Innenstadt"] },
        { name: "Heidelberg", dongs: ["Altstadt"] },
        { name: "Freiburg", dongs: ["Altstadt"] },
      ],
    },
    {
      name: "Hamburg",
      shortName: "Hamburg",
      gunguList: [
        { name: "Hamburg-Mitte", dongs: ["Altstadt", "Neustadt", "HafenCity", "St. Pauli"] },
        { name: "Altona", dongs: ["Ottensen", "Altona-Nord"] },
      ],
    },
    {
      name: "Sachsen (Saxony)",
      shortName: "Sachsen",
      gunguList: [
        { name: "Dresden", dongs: ["Innere Altstadt", "Neustadt"] },
        { name: "Leipzig", dongs: ["Zentrum", "Plagwitz"] },
      ],
    },
    {
      name: "Niedersachsen (Lower Saxony)",
      shortName: "Niedersachsen",
      gunguList: [
        { name: "Hannover", dongs: ["Mitte", "Südstadt"] },
        { name: "Braunschweig", dongs: ["Innenstadt"] },
        { name: "Osnabrück", dongs: ["Innenstadt"] },
      ],
    },
    {
      name: "Rheinland-Pfalz",
      shortName: "RLP",
      gunguList: [
        { name: "Mainz", dongs: ["Altstadt", "Neustadt"] },
        { name: "Ludwigshafen", dongs: ["Mitte"] },
        { name: "Koblenz", dongs: ["Altstadt"] },
      ],
    },
    {
      name: "Bremen",
      shortName: "Bremen",
      gunguList: [
        { name: "Bremen City", dongs: ["Mitte", "Neustadt"] },
        { name: "Bremerhaven", dongs: ["Mitte"] },
      ],
    },
    {
      name: "Schleswig-Holstein",
      shortName: "SH",
      gunguList: [
        { name: "Kiel", dongs: ["Mitte", "Vorstadt"] },
        { name: "Lübeck", dongs: ["Innenstadt"] },
      ],
    },
    {
      name: "Brandenburg",
      shortName: "Brandenburg",
      gunguList: [
        { name: "Potsdam", dongs: ["Innenstadt", "Babelsberg"] },
        { name: "Cottbus", dongs: ["Mitte"] },
      ],
    },
    {
      name: "Thüringen",
      shortName: "Thüringen",
      gunguList: [
        { name: "Erfurt", dongs: ["Altstadt"] },
        { name: "Jena", dongs: ["Zentrum"] },
        { name: "Weimar", dongs: ["Altstadt"] },
      ],
    },
    {
      name: "Sachsen-Anhalt",
      shortName: "Sachsen-Anhalt",
      gunguList: [
        { name: "Magdeburg", dongs: ["Altstadt"] },
        { name: "Halle (Saale)", dongs: ["Altstadt"] },
      ],
    },
    {
      name: "Mecklenburg-Vorpommern",
      shortName: "MV",
      gunguList: [
        { name: "Rostock", dongs: ["Stadtmitte"] },
        { name: "Schwerin", dongs: ["Altstadt"] },
      ],
    },
    {
      name: "Saarland",
      shortName: "Saarland",
      gunguList: [
        { name: "Saarbrücken", dongs: ["Mitte", "St. Johann"] },
      ],
    },
  ],
  FR: [
    {
      name: "Île-de-France",
      shortName: "Paris Reg.",
      gunguList: [
        { name: "Paris", dongs: ["1er Arrondissement", "2e Arrondissement", "8e (Champs-Élysées)", "9e (Opéra)", "15e Arrondissement", "16e Arrondissement"] },
        { name: "Hauts-de-Seine", dongs: ["Boulogne-Billancourt", "Neuilly-sur-Seine", "La Défense", "Issy-les-Moulineaux"] },
        { name: "Yvelines", dongs: ["Versailles", "Saint-Germain-en-Laye"] },
      ],
    },
    {
      name: "Auvergne-Rhône-Alpes",
      shortName: "Lyon Reg.",
      gunguList: [
        { name: "Lyon", dongs: ["Presqu'île", "Vieux Lyon", "Part-Dieu", "Croix-Rousse"] },
        { name: "Grenoble", dongs: ["Centre-Ville"] },
        { name: "Saint-Étienne", dongs: ["Centre"] },
      ],
    },
    {
      name: "Provence-Alpes-Côte d'Azur",
      shortName: "PACA",
      gunguList: [
        { name: "Marseille", dongs: ["Vieux-Port", "Prado", "La Plaine"] },
        { name: "Nice", dongs: ["Promenade des Anglais", "Vieux Nice", "Cimiez"] },
        { name: "Cannes", dongs: ["La Croisette"] },
      ],
    },
    {
      name: "Nouvelle-Aquitaine",
      shortName: "Aquitaine",
      gunguList: [
        { name: "Bordeaux", dongs: ["Centre-Ville", "Chartrons", "Saint-Pierre"] },
        { name: "Limoges", dongs: ["Centre"] },
        { name: "Poitiers", dongs: ["Centre"] },
      ],
    },
    {
      name: "Occitanie",
      shortName: "Occitanie",
      gunguList: [
        { name: "Toulouse", dongs: ["Capitole", "Carmes", "Saint-Cyprien"] },
        { name: "Montpellier", dongs: ["Écusson", "Antigone"] },
      ],
    },
    {
      name: "Hauts-de-France",
      shortName: "Lille Reg.",
      gunguList: [
        { name: "Lille", dongs: ["Vieux-Lille", "Centre", "Wazemmes"] },
        { name: "Amiens", dongs: ["Centre-Ville"] },
      ],
    },
    {
      name: "Grand Est",
      shortName: "Strasbourg Reg.",
      gunguList: [
        { name: "Strasbourg", dongs: ["Grande Île", "Krutenau", "Petite France"] },
        { name: "Reims", dongs: ["Centre"] },
        { name: "Metz", dongs: ["Centre-Ville"] },
      ],
    },
    {
      name: "Pays de la Loire",
      shortName: "Nantes Reg.",
      gunguList: [
        { name: "Nantes", dongs: ["Centre-Ville", "Île de Nantes", "Graslin"] },
        { name: "Angers", dongs: ["Centre"] },
      ],
    },
    {
      name: "Bretagne (Brittany)",
      shortName: "Bretagne",
      gunguList: [
        { name: "Rennes", dongs: ["Centre-Ville", "Thabor"] },
        { name: "Brest", dongs: ["Centre"] },
        { name: "Saint-Malo", dongs: ["Intra-Muros"] },
      ],
    },
    {
      name: "Normandie",
      shortName: "Normandie",
      gunguList: [
        { name: "Rouen", dongs: ["Vieux-Rouen"] },
        { name: "Caen", dongs: ["Centre-Ville"] },
        { name: "Le Havre", dongs: ["Centre-Ville"] },
      ],
    },
    {
      name: "Bourgogne-Franche-Comté",
      shortName: "Bourgogne",
      gunguList: [
        { name: "Dijon", dongs: ["Centre Historique"] },
        { name: "Besançon", dongs: ["Boucle"] },
      ],
    },
    {
      name: "Centre-Val de Loire",
      shortName: "Centre",
      gunguList: [
        { name: "Orléans", dongs: ["Centre-Ville"] },
        { name: "Tours", dongs: ["Vieux-Tours"] },
      ],
    },
    {
      name: "Corse (Corsica)",
      shortName: "Corse",
      gunguList: [
        { name: "Ajaccio", dongs: ["Centre"] },
        { name: "Bastia", dongs: ["Vieux-Port"] },
      ],
    },
    {
      name: "Guadeloupe",
      shortName: "Guadeloupe",
      gunguList: [
        { name: "Pointe-à-Pitre", dongs: ["Centre"] },
        { name: "Les Abymes", dongs: ["Centre"] },
      ],
    },
    {
      name: "Martinique",
      shortName: "Martinique",
      gunguList: [
        { name: "Fort-de-France", dongs: ["Centre"] },
      ],
    },
    {
      name: "Guyane (French Guiana)",
      shortName: "Guyane",
      gunguList: [
        { name: "Cayenne", dongs: ["Centre"] },
      ],
    },
    {
      name: "La Réunion",
      shortName: "Réunion",
      gunguList: [
        { name: "Saint-Denis", dongs: ["Centre"] },
      ],
    },
    {
      name: "Mayotte",
      shortName: "Mayotte",
      gunguList: [
        { name: "Mamoudzou", dongs: ["Centre"] },
      ],
    },
  ],
  IT: [
    {
      name: "Lombardia (Lombardy)",
      shortName: "Lombardia",
      gunguList: [
        { name: "Milano", dongs: ["Centro Storico", "Duomo", "Porta Nuova", "Navigli", "Brera", "Isola"] },
        { name: "Brescia", dongs: ["Centro"] },
        { name: "Bergamo", dongs: ["Città Alta", "Città Bassa"] },
      ],
    },
    {
      name: "Lazio",
      shortName: "Lazio",
      gunguList: [
        { name: "Roma", dongs: ["Centro Storico", "Trastevere", "Prati", "EUR", "Parioli", "Monti"] },
        { name: "Latina", dongs: ["Centro"] },
      ],
    },
    {
      name: "Veneto",
      shortName: "Veneto",
      gunguList: [
        { name: "Venezia", dongs: ["San Marco", "Cannaregio", "Mestre"] },
        { name: "Verona", dongs: ["Centro Storico"] },
        { name: "Padova", dongs: ["Centro"] },
      ],
    },
    {
      name: "Piemonte (Piedmont)",
      shortName: "Piemonte",
      gunguList: [
        { name: "Torino", dongs: ["Centro", "Crocetta", "San Salvario", "Quadrilatero"] },
      ],
    },
    {
      name: "Emilia-Romagna",
      shortName: "Emilia",
      gunguList: [
        { name: "Bologna", dongs: ["Centro Storico", "Santo Stefano", "Saragozza"] },
        { name: "Modena", dongs: ["Centro"] },
        { name: "Parma", dongs: ["Centro"] },
      ],
    },
    {
      name: "Toscana (Tuscany)",
      shortName: "Toscana",
      gunguList: [
        { name: "Firenze (Florence)", dongs: ["Centro Storico", "Santa Maria Novella", "Oltrarno"] },
        { name: "Pisa", dongs: ["Centro"] },
        { name: "Siena", dongs: ["Centro"] },
      ],
    },
    {
      name: "Campania",
      shortName: "Campania",
      gunguList: [
        { name: "Napoli (Naples)", dongs: ["Centro Storico", "Chiaia", "Vomero", "Posillipo"] },
        { name: "Salerno", dongs: ["Centro"] },
      ],
    },
    {
      name: "Sicilia (Sicily)",
      shortName: "Sicilia",
      gunguList: [
        { name: "Palermo", dongs: ["Centro Storico", "Politeama"] },
        { name: "Catania", dongs: ["Centro"] },
        { name: "Messina", dongs: ["Centro"] },
      ],
    },
    {
      name: "Puglia (Apulia)",
      shortName: "Puglia",
      gunguList: [
        { name: "Bari", dongs: ["Murat", "Bari Vecchia"] },
        { name: "Lecce", dongs: ["Centro Storico"] },
      ],
    },
    {
      name: "Liguria",
      shortName: "Liguria",
      gunguList: [
        { name: "Genova (Genoa)", dongs: ["Centro Storico", "Carignano", "Albaro"] },
        { name: "La Spezia", dongs: ["Centro"] },
      ],
    },
    {
      name: "Friuli Venezia Giulia",
      shortName: "FVG",
      gunguList: [
        { name: "Trieste", dongs: ["Centro Storico", "Borgo Teresiano"] },
        { name: "Udine", dongs: ["Centro"] },
      ],
    },
    {
      name: "Marche",
      shortName: "Marche",
      gunguList: [
        { name: "Ancona", dongs: ["Centro"] },
        { name: "Pesaro", dongs: ["Centro"] },
      ],
    },
    {
      name: "Sardegna (Sardinia)",
      shortName: "Sardegna",
      gunguList: [
        { name: "Cagliari", dongs: ["Castello", "Marina"] },
        { name: "Sassari", dongs: ["Centro"] },
      ],
    },
    {
      name: "Abruzzo",
      shortName: "Abruzzo",
      gunguList: [
        { name: "Pescara", dongs: ["Centro"] },
        { name: "L'Aquila", dongs: ["Centro"] },
      ],
    },
    {
      name: "Trentino-Alto Adige",
      shortName: "Trentino",
      gunguList: [
        { name: "Trento", dongs: ["Centro Storico"] },
        { name: "Bolzano (Bozen)", dongs: ["Centro"] },
      ],
    },
    {
      name: "Umbria",
      shortName: "Umbria",
      gunguList: [
        { name: "Perugia", dongs: ["Centro Storico"] },
        { name: "Terni", dongs: ["Centro"] },
      ],
    },
    {
      name: "Calabria",
      shortName: "Calabria",
      gunguList: [
        { name: "Reggio Calabria", dongs: ["Centro"] },
        { name: "Catanzaro", dongs: ["Centro"] },
      ],
    },
    {
      name: "Basilicata",
      shortName: "Basilicata",
      gunguList: [
        { name: "Potenza", dongs: ["Centro"] },
        { name: "Matera", dongs: ["Sassi", "Centro"] },
      ],
    },
    {
      name: "Molise",
      shortName: "Molise",
      gunguList: [
        { name: "Campobasso", dongs: ["Centro"] },
        { name: "Isernia", dongs: ["Centro"] },
      ],
    },
    {
      name: "Valle d'Aosta",
      shortName: "Valle d'Aosta",
      gunguList: [
        { name: "Aosta", dongs: ["Centro"] },
      ],
    },
  ],
  ES: [
    {
      name: "Comunidad de Madrid",
      shortName: "Madrid",
      gunguList: [
        { name: "Madrid Capital", dongs: ["Centro (Sol/Gran Vía)", "Salamanca", "Chamberí", "Chamartín", "Retiro", "Moncloa"] },
        { name: "Alcobendas", dongs: ["La Moraleja"] },
        { name: "Pozuelo de Alarcón", dongs: ["Centro"] },
      ],
    },
    {
      name: "Cataluña (Catalonia)",
      shortName: "Cataluña",
      gunguList: [
        { name: "Barcelona", dongs: ["Eixample", "Ciutat Vella (Gòtic)", "Gràcia", "Sarrià-Sant Gervasi", "Poblenou"] },
        { name: "Hospitalet de Llobregat", dongs: ["Centre"] },
        { name: "Badalona", dongs: ["Centre"] },
      ],
    },
    {
      name: "Andalucía",
      shortName: "Andalucía",
      gunguList: [
        { name: "Sevilla", dongs: ["Casco Antiguo", "Triana", "Nervión"] },
        { name: "Málaga", dongs: ["Centro Histórico", "Teatinos"] },
        { name: "Granada", dongs: ["Centro", "Albaicín"] },
      ],
    },
    {
      name: "Comunidad Valenciana",
      shortName: "Valencia",
      gunguList: [
        { name: "Valencia Capital", dongs: ["Ciutat Vella", "Eixample", "Poblats Marítims"] },
        { name: "Alicante", dongs: ["Centro"] },
        { name: "Castellón", dongs: ["Centro"] },
      ],
    },
    {
      name: "País Vasco (Basque Country)",
      shortName: "País Vasco",
      gunguList: [
        { name: "Bilbao", dongs: ["Abando", "Casco Viejo", "Indautxu"] },
        { name: "San Sebastián (Donostia)", dongs: ["Centro", "Gros"] },
        { name: "Vitoria-Gasteiz", dongs: ["Centro"] },
      ],
    },
    {
      name: "Galicia",
      shortName: "Galicia",
      gunguList: [
        { name: "A Coruña", dongs: ["Centro", "Riazor"] },
        { name: "Vigo", dongs: ["Centro"] },
        { name: "Santiago de Compostela", dongs: ["Casco Histórico"] },
      ],
    },
    {
      name: "Castilla y León",
      shortName: "Castilla y León",
      gunguList: [
        { name: "Valladolid", dongs: ["Centro"] },
        { name: "Salamanca", dongs: ["Centro Histórico"] },
        { name: "Burgos", dongs: ["Centro"] },
        { name: "León", dongs: ["Centro"] },
      ],
    },
    {
      name: "Islas Canarias (Canary Islands)",
      shortName: "Canarias",
      gunguList: [
        { name: "Las Palmas de Gran Canaria", dongs: ["Vegueta", "Puerto-Canteras"] },
        { name: "Santa Cruz de Tenerife", dongs: ["Centro"] },
      ],
    },
    {
      name: "Castilla-La Mancha",
      shortName: "Castilla-La Mancha",
      gunguList: [
        { name: "Toledo", dongs: ["Casco Histórico"] },
        { name: "Albacete", dongs: ["Centro"] },
        { name: "Ciudad Real", dongs: ["Centro"] },
      ],
    },
    {
      name: "Región de Murcia",
      shortName: "Murcia",
      gunguList: [
        { name: "Murcia Capital", dongs: ["Centro", "La Flota"] },
        { name: "Cartagena", dongs: ["Centro"] },
      ],
    },
    {
      name: "Aragón",
      shortName: "Aragón",
      gunguList: [
        { name: "Zaragoza", dongs: ["Casco Antiguo", "Centro", "Delicias"] },
      ],
    },
    {
      name: "Islas Baleares (Balearic Islands)",
      shortName: "Baleares",
      gunguList: [
        { name: "Palma de Mallorca", dongs: ["Centre", "Santa Catalina"] },
        { name: "Ibiza", dongs: ["Eivissa"] },
      ],
    },
    {
      name: "Extremadura",
      shortName: "Extremadura",
      gunguList: [
        { name: "Badajoz", dongs: ["Centro"] },
        { name: "Cáceres", dongs: ["Ciudad Monumental"] },
        { name: "Mérida", dongs: ["Centro"] },
      ],
    },
    {
      name: "Principado de Asturias",
      shortName: "Asturias",
      gunguList: [
        { name: "Oviedo", dongs: ["Centro"] },
        { name: "Gijón", dongs: ["Centro", "Cimavilla"] },
      ],
    },
    {
      name: "Comunidad Foral de Navarra",
      shortName: "Navarra",
      gunguList: [
        { name: "Pamplona (Iruña)", dongs: ["Casco Antiguo", "Ensanche"] },
      ],
    },
    {
      name: "Cantabria",
      shortName: "Cantabria",
      gunguList: [
        { name: "Santander", dongs: ["Centro", "El Sardinero"] },
      ],
    },
    {
      name: "La Rioja",
      shortName: "La Rioja",
      gunguList: [
        { name: "Logroño", dongs: ["Casco Antiguo", "Centro"] },
      ],
    },
    {
      name: "Ceuta",
      shortName: "Ceuta",
      gunguList: [
        { name: "Ceuta", dongs: ["Centro"] },
      ],
    },
    {
      name: "Melilla",
      shortName: "Melilla",
      gunguList: [
        { name: "Melilla", dongs: ["Centro"] },
      ],
    },
  ],
  NL: [
    {
      name: "Noord-Holland (North Holland)",
      shortName: "Noord-Holland",
      gunguList: [
        { name: "Amsterdam", dongs: ["Centrum", "Zuid (South)", "Oost (East)", "West", "Noord", "Zuidas"] },
        { name: "Haarlem", dongs: ["Centrum"] },
        { name: "Amstelveen", dongs: ["Stadshart"] },
      ],
    },
    {
      name: "Zuid-Holland (South Holland)",
      shortName: "Zuid-Holland",
      gunguList: [
        { name: "Rotterdam", dongs: ["Centrum", "Kop van Zuid", "Kralingen"] },
        { name: "Den Haag (The Hague)", dongs: ["Centrum", "Scheveningen", "Bezuidenhout"] },
        { name: "Leiden", dongs: ["Binnenstad"] },
      ],
    },
    {
      name: "Utrecht",
      shortName: "Utrecht",
      gunguList: [
        { name: "Utrecht City", dongs: ["Binnenstad", "Oost", "Leidsche Rijn"] },
        { name: "Amersfoort", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Noord-Brabant",
      shortName: "Noord-Brabant",
      gunguList: [
        { name: "Eindhoven", dongs: ["Centrum", "Strijp-S"] },
        { name: "Tilburg", dongs: ["Centrum"] },
        { name: "Breda", dongs: ["Binnenstad"] },
        { name: "'s-Hertogenbosch", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Gelderland",
      shortName: "Gelderland",
      gunguList: [
        { name: "Nijmegen", dongs: ["Centrum"] },
        { name: "Arnhem", dongs: ["Centrum"] },
        { name: "Apeldoorn", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Groningen",
      shortName: "Groningen",
      gunguList: [
        { name: "Groningen City", dongs: ["Binnenstad", "Oosterpoort"] },
      ],
    },
    {
      name: "Overijssel",
      shortName: "Overijssel",
      gunguList: [
        { name: "Enschede", dongs: ["Centrum"] },
        { name: "Zwolle", dongs: ["Binnenstad"] },
      ],
    },
    {
      name: "Limburg",
      shortName: "Limburg",
      gunguList: [
        { name: "Maastricht", dongs: ["Centrum", "Wyck"] },
        { name: "Venlo", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Friesland (Fryslân)",
      shortName: "Friesland",
      gunguList: [
        { name: "Leeuwarden", dongs: ["Binnenstad"] },
      ],
    },
    {
      name: "Flevoland",
      shortName: "Flevoland",
      gunguList: [
        { name: "Almere", dongs: ["Stad"] },
        { name: "Lelystad", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Drenthe",
      shortName: "Drenthe",
      gunguList: [
        { name: "Assen", dongs: ["Centrum"] },
        { name: "Emmen", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Zeeland",
      shortName: "Zeeland",
      gunguList: [
        { name: "Middelburg", dongs: ["Binnenstad"] },
        { name: "Vlissingen", dongs: ["Centrum"] },
      ],
    },
  ],
  PL: [
    {
      name: "Mazowieckie",
      shortName: "Mazowsze",
      gunguList: [
        { name: "Warszawa (Warsaw)", dongs: ["Śródmieście (Center)", "Mokotów", "Wola", "Ochota", "Ursynów", "Praga"] },
        { name: "Radom", dongs: ["Centrum"] },
        { name: "Płock", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Małopolskie",
      shortName: "Małopolska",
      gunguList: [
        { name: "Kraków", dongs: ["Stare Miasto", "Kazimierz", "Podgórze", "Krowodrza"] },
        { name: "Tarnów", dongs: ["Centrum"] },
        { name: "Nowy Sącz", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Dolnośląskie (Lower Silesian)",
      shortName: "Dolny Śląsk",
      gunguList: [
        { name: "Wrocław", dongs: ["Stare Miasto", "Krzyki", "Śródmieście", "Fabryczna"] },
        { name: "Wałbrzych", dongs: ["Centrum"] },
        { name: "Legnica", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Wielkopolskie",
      shortName: "Wielkopolska",
      gunguList: [
        { name: "Poznań", dongs: ["Stare Miasto", "Jeżyce", "Grunwald", "Wilda"] },
        { name: "Kalisz", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Śląskie (Silesian)",
      shortName: "Śląsk",
      gunguList: [
        { name: "Katowice", dongs: ["Śródmieście", "Brynów"] },
        { name: "Gliwice", dongs: ["Centrum"] },
        { name: "Częstochowa", dongs: ["Centrum"] },
        { name: "Sosnowiec", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Pomorskie",
      shortName: "Pomorze",
      gunguList: [
        { name: "Gdańsk", dongs: ["Śródmieście", "Wrzeszcz", "Oliwa"] },
        { name: "Gdynia", dongs: ["Śródmieście"] },
        { name: "Sopot", dongs: ["Dolny Sopot"] },
      ],
    },
    {
      name: "Łódzkie",
      shortName: "Łódzkie",
      gunguList: [
        { name: "Łódź", dongs: ["Śródmieście (Piotrkowska)", "Bałuty", "Widzew"] },
        { name: "Piotrków Trybunalski", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Kujawsko-Pomorskie",
      shortName: "Kujawy",
      gunguList: [
        { name: "Bydgoszcz", dongs: ["Śródmieście"] },
        { name: "Toruń", dongs: ["Stare Miasto"] },
      ],
    },
    {
      name: "Lubelskie",
      shortName: "Lubelskie",
      gunguList: [
        { name: "Lublin", dongs: ["Śródmieście", "Stare Miasto"] },
        { name: "Zamość", dongs: ["Stare Miasto"] },
      ],
    },
    {
      name: "Podkarpackie",
      shortName: "Podkarpacie",
      gunguList: [
        { name: "Rzeszów", dongs: ["Śródmieście", "Nowe Miasto"] },
        { name: "Przemyśl", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Zachodniopomorskie",
      shortName: "Zach. Pomorze",
      gunguList: [
        { name: "Szczecin", dongs: ["Śródmieście"] },
        { name: "Koszalin", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Podlaskie",
      shortName: "Podlasie",
      gunguList: [
        { name: "Białystok", dongs: ["Centrum", "Sienkiewicza"] },
        { name: "Łomża", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Świętokrzyskie",
      shortName: "Świętokrzyskie",
      gunguList: [
        { name: "Kielce", dongs: ["Śródmieście"] },
        { name: "Ostrowiec Świętokrzyski", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Warmińsko-Mazurskie",
      shortName: "Warmia-Mazury",
      gunguList: [
        { name: "Olsztyn", dongs: ["Śródmieście", "Stare Miasto"] },
        { name: "Elbląg", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Lubuskie",
      shortName: "Lubuskie",
      gunguList: [
        { name: "Zielona Góra", dongs: ["Centrum"] },
        { name: "Gorzów Wielkopolski", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Opolskie",
      shortName: "Opolskie",
      gunguList: [
        { name: "Opole", dongs: ["Śródmieście"] },
      ],
    },
  ],
  SE: [
    {
      name: "Stockholm",
      shortName: "Stockholm",
      gunguList: [
        { name: "Stockholm City", dongs: ["Norrmalm", "Södermalm", "Östermalm", "Kungsholmen", "Vasastan"] },
        { name: "Solna", dongs: ["Råsunda", "Arenastaden"] },
        { name: "Kista", dongs: ["Kista Science City"] },
      ],
    },
    {
      name: "Västra Götaland",
      shortName: "Västra Götaland",
      gunguList: [
        { name: "Göteborg (Gothenburg)", dongs: ["Centrum", "Majorna", "Linnéstaden", "Haga"] },
        { name: "Borås", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Skåne",
      shortName: "Skåne",
      gunguList: [
        { name: "Malmö", dongs: ["Centrum", "Västra Hamnen", "Möllevången"] },
        { name: "Helsingborg", dongs: ["Centrum"] },
        { name: "Lund", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Uppsala",
      shortName: "Uppsala",
      gunguList: [
        { name: "Uppsala City", dongs: ["Centrum", "Luthagen", "Fålhagen"] },
      ],
    },
    {
      name: "Östergötland",
      shortName: "Östergötland",
      gunguList: [
        { name: "Linköping", dongs: ["Centrum"] },
        { name: "Norrköping", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Jönköping",
      shortName: "Jönköping",
      gunguList: [
        { name: "Jönköping City", dongs: ["Centrum", "Väster"] },
      ],
    },
    {
      name: "Halland",
      shortName: "Halland",
      gunguList: [
        { name: "Halmstad", dongs: ["Centrum"] },
        { name: "Kungsbacka", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Örebro",
      shortName: "Örebro",
      gunguList: [
        { name: "Örebro City", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Västmanland",
      shortName: "Västmanland",
      gunguList: [
        { name: "Västerås", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Dalarna",
      shortName: "Dalarna",
      gunguList: [
        { name: "Falun", dongs: ["Centrum"] },
        { name: "Borlänge", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Gävleborg",
      shortName: "Gävleborg",
      gunguList: [
        { name: "Gävle", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Värmland",
      shortName: "Värmland",
      gunguList: [
        { name: "Karlstad", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Västerbotten",
      shortName: "Västerbotten",
      gunguList: [
        { name: "Umeå", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Norrbotten",
      shortName: "Norrbotten",
      gunguList: [
        { name: "Luleå", dongs: ["Centrum"] },
        { name: "Kiruna", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Västernorrland",
      shortName: "Västernorrland",
      gunguList: [
        { name: "Sundsvall", dongs: ["Stenstan"] },
      ],
    },
    {
      name: "Kronoberg",
      shortName: "Kronoberg",
      gunguList: [
        { name: "Växjö", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Kalmar",
      shortName: "Kalmar",
      gunguList: [
        { name: "Kalmar City", dongs: ["Kvarnholmen"] },
      ],
    },
    {
      name: "Södermanland",
      shortName: "Södermanland",
      gunguList: [
        { name: "Eskilstuna", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Blekinge",
      shortName: "Blekinge",
      gunguList: [
        { name: "Karlskrona", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Jämtland",
      shortName: "Jämtland",
      gunguList: [
        { name: "Östersund", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Gotland",
      shortName: "Gotland",
      gunguList: [
        { name: "Visby", dongs: ["Innerstaden"] },
      ],
    },
  ],
  NO: [
    {
      name: "Oslo",
      shortName: "Oslo",
      gunguList: [
        { name: "Oslo Sentrum", dongs: ["Sentrum", "Frogner", "Majorstuen", "Grünerløkka", "St. Hanshaugen", "Gamle Oslo"] },
      ],
    },
    {
      name: "Vestland",
      shortName: "Vestland",
      gunguList: [
        { name: "Bergen", dongs: ["Bergenhus", "Sentrum", "Årstad", "Fana"] },
        { name: "Førde", dongs: ["Sentrum"] },
      ],
    },
    {
      name: "Trøndelag",
      shortName: "Trøndelag",
      gunguList: [
        { name: "Trondheim", dongs: ["Midtbyen", "Østbyen", "Lerkendal"] },
      ],
    },
    {
      name: "Rogaland",
      shortName: "Rogaland",
      gunguList: [
        { name: "Stavanger", dongs: ["Sentrum", "Hinna"] },
        { name: "Sandnes", dongs: ["Sentrum"] },
        { name: "Haugesund", dongs: ["Sentrum"] },
      ],
    },
    {
      name: "Akershus",
      shortName: "Akershus",
      gunguList: [
        { name: "Bærum", dongs: ["Sandvika", "Lysaker"] },
        { name: "Asker", dongs: ["Sentrum"] },
        { name: "Lillestrøm", dongs: ["Sentrum"] },
      ],
    },
    {
      name: "Møre og Romsdal",
      shortName: "Møre og Romsdal",
      gunguList: [
        { name: "Ålesund", dongs: ["Sentrum"] },
        { name: "Molde", dongs: ["Sentrum"] },
      ],
    },
    {
      name: "Nordland",
      shortName: "Nordland",
      gunguList: [
        { name: "Bodø", dongs: ["Sentrum"] },
        { name: "Narvik", dongs: ["Sentrum"] },
      ],
    },
    {
      name: "Troms",
      shortName: "Troms",
      gunguList: [
        { name: "Tromsø", dongs: ["Tromsøya", "Sentrum"] },
      ],
    },
    {
      name: "Innlandet",
      shortName: "Innlandet",
      gunguList: [
        { name: "Hamar", dongs: ["Sentrum"] },
        { name: "Lillehammer", dongs: ["Sentrum"] },
        { name: "Gjøvik", dongs: ["Sentrum"] },
      ],
    },
    {
      name: "Østfold",
      shortName: "Østfold",
      gunguList: [
        { name: "Fredrikstad", dongs: ["Sentrum"] },
        { name: "Sarpsborg", dongs: ["Sentrum"] },
        { name: "Moss", dongs: ["Sentrum"] },
      ],
    },
    {
      name: "Buskerud",
      shortName: "Buskerud",
      gunguList: [
        { name: "Drammen", dongs: ["Sentrum"] },
        { name: "Kongsberg", dongs: ["Sentrum"] },
      ],
    },
    {
      name: "Vestfold",
      shortName: "Vestfold",
      gunguList: [
        { name: "Tønsberg", dongs: ["Sentrum"] },
        { name: "Sandefjord", dongs: ["Sentrum"] },
      ],
    },
    {
      name: "Telemark",
      shortName: "Telemark",
      gunguList: [
        { name: "Skien", dongs: ["Sentrum"] },
        { name: "Porsgrunn", dongs: ["Sentrum"] },
      ],
    },
    {
      name: "Agder",
      shortName: "Agder",
      gunguList: [
        { name: "Kristiansand", dongs: ["Kvadraturen", "Grim"] },
        { name: "Arendal", dongs: ["Sentrum"] },
      ],
    },
    {
      name: "Finnmark",
      shortName: "Finnmark",
      gunguList: [
        { name: "Alta", dongs: ["Sentrum"] },
        { name: "Hammerfest", dongs: ["Sentrum"] },
      ],
    },
  ],
  DK: [
    {
      name: "Region Hovedstaden (Capital)",
      shortName: "Hovedstaden",
      gunguList: [
        { name: "København (Copenhagen)", dongs: ["Indre By (City)", "Vesterbro", "Nørrebro", "Østerbro", "Frederiksberg"] },
        { name: "Helsingør", dongs: ["Centrum"] },
        { name: "Hillerød", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Region Midtjylland (Central)",
      shortName: "Midtjylland",
      gunguList: [
        { name: "Aarhus", dongs: ["Aarhus C", "Trøjborg", "Viby"] },
        { name: "Randers", dongs: ["Centrum"] },
        { name: "Horsens", dongs: ["Centrum"] },
        { name: "Silkeborg", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Region Syddanmark (Southern)",
      shortName: "Syddanmark",
      gunguList: [
        { name: "Odense", dongs: ["Centrum", "Odense M"] },
        { name: "Esbjerg", dongs: ["Centrum"] },
        { name: "Kolding", dongs: ["Centrum"] },
        { name: "Vejle", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Region Nordjylland (Northern)",
      shortName: "Nordjylland",
      gunguList: [
        { name: "Aalborg", dongs: ["Centrum", "Aalborg Øst"] },
        { name: "Hjørring", dongs: ["Centrum"] },
      ],
    },
    {
      name: "Region Sjælland (Zealand)",
      shortName: "Sjælland",
      gunguList: [
        { name: "Roskilde", dongs: ["Centrum"] },
        { name: "Næstved", dongs: ["Centrum"] },
        { name: "Køge", dongs: ["Centrum"] },
      ],
    },
  ],
  CH: [
    {
      name: "Zürich",
      shortName: "ZH",
      gunguList: [
        { name: "Zürich City", dongs: ["Altstadt", "Wiedikon", "Aussersihl", "Zürich West"] },
        { name: "Winterthur", dongs: ["Altstadt"] },
      ],
    },
    {
      name: "Genève (Geneva)",
      shortName: "GE",
      gunguList: [
        { name: "Genève City", dongs: ["Cité-Centre", "Eaux-Vives", "Pâquis", "Plainpalais"] },
      ],
    },
    {
      name: "Vaud",
      shortName: "VD",
      gunguList: [
        { name: "Lausanne", dongs: ["Centre-Ville", "Ouchy", "Flon"] },
        { name: "Montreux", dongs: ["Centre"] },
      ],
    },
    {
      name: "Bern",
      shortName: "BE",
      gunguList: [
        { name: "Bern City", dongs: ["Innere Stadt", "Länggasse", "Mattenhof"] },
        { name: "Thun", dongs: ["Zentrum"] },
        { name: "Biel/Bienne", dongs: ["Zentrum"] },
      ],
    },
    {
      name: "Basel-Stadt",
      shortName: "BS",
      gunguList: [
        { name: "Basel City", dongs: ["Grossbasel", "Kleinbasel", "St. Alban"] },
      ],
    },
    {
      name: "Luzern",
      shortName: "LU",
      gunguList: [
        { name: "Luzern City", dongs: ["Altstadt", "Neustadt"] },
      ],
    },
    {
      name: "St. Gallen",
      shortName: "SG",
      gunguList: [
        { name: "St. Gallen City", dongs: ["Innenstadt"] },
      ],
    },
    {
      name: "Aargau",
      shortName: "AG",
      gunguList: [
        { name: "Aarau", dongs: ["Zentrum"] },
        { name: "Baden", dongs: ["Zentrum"] },
      ],
    },
    {
      name: "Zug",
      shortName: "ZG",
      gunguList: [
        { name: "Zug City", dongs: ["Altstadt", "Neustadt"] },
      ],
    },
    {
      name: "Ticino",
      shortName: "TI",
      gunguList: [
        { name: "Lugano", dongs: ["Centro"] },
        { name: "Bellinzona", dongs: ["Centro"] },
        { name: "Locarno", dongs: ["Centro"] },
      ],
    },
    {
      name: "Valais",
      shortName: "VS",
      gunguList: [
        { name: "Sion", dongs: ["Centre"] },
        { name: "Martigny", dongs: ["Centre"] },
      ],
    },
    {
      name: "Neuchâtel",
      shortName: "NE",
      gunguList: [
        { name: "Neuchâtel City", dongs: ["Centre"] },
      ],
    },
    {
      name: "Fribourg",
      shortName: "FR",
      gunguList: [
        { name: "Fribourg City", dongs: ["Centre-Ville"] },
      ],
    },
    {
      name: "Solothurn",
      shortName: "SO",
      gunguList: [
        { name: "Solothurn City", dongs: ["Altstadt"] },
        { name: "Olten", dongs: ["Zentrum"] },
      ],
    },
    {
      name: "Graubünden",
      shortName: "GR",
      gunguList: [
        { name: "Chur", dongs: ["Altstadt"] },
        { name: "Davos", dongs: ["Platz"] },
        { name: "St. Moritz", dongs: ["Dorf"] },
      ],
    },
    {
      name: "Thurgau",
      shortName: "TG",
      gunguList: [
        { name: "Frauenfeld", dongs: ["Zentrum"] },
        { name: "Kreuzlingen", dongs: ["Zentrum"] },
      ],
    },
    {
      name: "Basel-Landschaft",
      shortName: "BL",
      gunguList: [
        { name: "Liestal", dongs: ["Altstadt"] },
      ],
    },
    {
      name: "Schaffhausen",
      shortName: "SH",
      gunguList: [
        { name: "Schaffhausen City", dongs: ["Altstadt"] },
      ],
    },
    {
      name: "Schwyz",
      shortName: "SZ",
      gunguList: [
        { name: "Schwyz City", dongs: ["Zentrum"] },
      ],
    },
    {
      name: "Jura",
      shortName: "JU",
      gunguList: [
        { name: "Delémont", dongs: ["Centre"] },
      ],
    },
    {
      name: "Appenzell Ausserrhoden",
      shortName: "AR",
      gunguList: [
        { name: "Herisau", dongs: ["Zentrum"] },
      ],
    },
    {
      name: "Appenzell Innerrhoden",
      shortName: "AI",
      gunguList: [
        { name: "Appenzell", dongs: ["Dorf"] },
      ],
    },
    {
      name: "Glarus",
      shortName: "GL",
      gunguList: [
        { name: "Glarus", dongs: ["Zentrum"] },
      ],
    },
    {
      name: "Nidwalden",
      shortName: "NW",
      gunguList: [
        { name: "Stans", dongs: ["Dorf"] },
      ],
    },
    {
      name: "Obwalden",
      shortName: "OW",
      gunguList: [
        { name: "Sarnen", dongs: ["Dorf"] },
      ],
    },
    {
      name: "Uri",
      shortName: "UR",
      gunguList: [
        { name: "Altdorf", dongs: ["Zentrum"] },
      ],
    },
  ],
  PT: [
    {
      name: "Lisboa",
      shortName: "Lisboa",
      gunguList: [
        { name: "Lisbon Capital", dongs: ["Baixa", "Chiado", "Avenidas Novas", "Parque das Nações", "Belém", "Campo de Ourique"] },
        { name: "Cascais", dongs: ["Centro"] },
        { name: "Sintra", dongs: ["Vila"] },
      ],
    },
    {
      name: "Porto",
      shortName: "Porto",
      gunguList: [
        { name: "Porto Capital", dongs: ["Centro / Baixa", "Cedofeita", "Foz do Douro", "Boavista"] },
        { name: "Vila Nova de Gaia", dongs: ["Centro"] },
      ],
    },
    {
      name: "Faro (Algarve)",
      shortName: "Algarve",
      gunguList: [
        { name: "Faro City", dongs: ["Centro"] },
        { name: "Albufeira", dongs: ["Centro"] },
        { name: "Lagos", dongs: ["Centro"] },
        { name: "Portimão", dongs: ["Centro"] },
      ],
    },
    {
      name: "Braga",
      shortName: "Braga",
      gunguList: [
        { name: "Braga City", dongs: ["Centro Histórico"] },
        { name: "Guimarães", dongs: ["Centro"] },
      ],
    },
    {
      name: "Setúbal",
      shortName: "Setúbal",
      gunguList: [
        { name: "Setúbal City", dongs: ["Centro"] },
        { name: "Almada", dongs: ["Centro"] },
      ],
    },
    {
      name: "Coimbra",
      shortName: "Coimbra",
      gunguList: [
        { name: "Coimbra City", dongs: ["Alta", "Baixa"] },
      ],
    },
    {
      name: "Aveiro",
      shortName: "Aveiro",
      gunguList: [
        { name: "Aveiro City", dongs: ["Glória", "Vera Cruz"] },
      ],
    },
    {
      name: "Leiria",
      shortName: "Leiria",
      gunguList: [
        { name: "Leiria City", dongs: ["Centro"] },
      ],
    },
    {
      name: "Santarém",
      shortName: "Santarém",
      gunguList: [
        { name: "Santarém City", dongs: ["Centro"] },
      ],
    },
    {
      name: "Viseu",
      shortName: "Viseu",
      gunguList: [
        { name: "Viseu City", dongs: ["Centro"] },
      ],
    },
    {
      name: "Viana do Castelo",
      shortName: "Viana",
      gunguList: [
        { name: "Viana City", dongs: ["Centro"] },
      ],
    },
    {
      name: "Vila Real",
      shortName: "Vila Real",
      gunguList: [
        { name: "Vila Real City", dongs: ["Centro"] },
      ],
    },
    {
      name: "Castelo Branco",
      shortName: "Castelo Branco",
      gunguList: [
        { name: "Castelo Branco City", dongs: ["Centro"] },
      ],
    },
    {
      name: "Guarda",
      shortName: "Guarda",
      gunguList: [
        { name: "Guarda City", dongs: ["Centro"] },
      ],
    },
    {
      name: "Évora",
      shortName: "Évora",
      gunguList: [
        { name: "Évora City", dongs: ["Centro Histórico"] },
      ],
    },
    {
      name: "Beja",
      shortName: "Beja",
      gunguList: [
        { name: "Beja City", dongs: ["Centro"] },
      ],
    },
    {
      name: "Bragança",
      shortName: "Bragança",
      gunguList: [
        { name: "Bragança City", dongs: ["Centro"] },
      ],
    },
    {
      name: "Portalegre",
      shortName: "Portalegre",
      gunguList: [
        { name: "Portalegre City", dongs: ["Centro"] },
      ],
    },
    {
      name: "Região Autónoma da Madeira",
      shortName: "Madeira",
      gunguList: [
        { name: "Funchal", dongs: ["Sé", "São Pedro", "Santa Maria"] },
      ],
    },
    {
      name: "Região Autónoma dos Açores",
      shortName: "Açores",
      gunguList: [
        { name: "Ponta Delgada", dongs: ["São Sebastião", "São Pedro"] },
      ],
    },
  ],
  GR: [
    {
      name: "Attica (Athens)",
      shortName: "Attica",
      gunguList: [
        { name: "Athens City", dongs: ["Syntagma", "Plaka", "Kolonaki", "Monastiraki", "Koukaki"] },
        { name: "Piraeus", dongs: ["Port Area", "Kastella"] },
        { name: "Northern Suburbs", dongs: ["Kifisia", "Marousi"] },
        { name: "Southern Suburbs", dongs: ["Glyfada", "Voula"] },
      ],
    },
    {
      name: "Central Macedonia",
      shortName: "C. Macedonia",
      gunguList: [
        { name: "Thessaloniki", dongs: ["Center", "Ladadika", "Kalamaria", "Ano Poli"] },
      ],
    },
    {
      name: "Crete",
      shortName: "Crete",
      gunguList: [
        { name: "Heraklion", dongs: ["Center"] },
        { name: "Chania", dongs: ["Old Town"] },
        { name: "Rethymno", dongs: ["Center"] },
      ],
    },
    {
      name: "Western Greece",
      shortName: "W. Greece",
      gunguList: [
        { name: "Patras", dongs: ["Center", "Agia Sofia"] },
      ],
    },
    {
      name: "Thessaly",
      shortName: "Thessaly",
      gunguList: [
        { name: "Larissa", dongs: ["Center"] },
        { name: "Volos", dongs: ["Center"] },
      ],
    },
    {
      name: "Peloponnese",
      shortName: "Peloponnese",
      gunguList: [
        { name: "Kalamata", dongs: ["Center"] },
        { name: "Tripoli", dongs: ["Center"] },
        { name: "Corinth", dongs: ["Center"] },
      ],
    },
    {
      name: "Epirus",
      shortName: "Epirus",
      gunguList: [
        { name: "Ioannina", dongs: ["Center", "Castle Area"] },
      ],
    },
    {
      name: "Eastern Macedonia and Thrace",
      shortName: "E. Macedonia",
      gunguList: [
        { name: "Alexandroupoli", dongs: ["Center"] },
        { name: "Kavala", dongs: ["Center"] },
      ],
    },
    {
      name: "Central Greece",
      shortName: "C. Greece",
      gunguList: [
        { name: "Lamia", dongs: ["Center"] },
        { name: "Chalcis", dongs: ["Center"] },
      ],
    },
    {
      name: "South Aegean",
      shortName: "S. Aegean",
      gunguList: [
        { name: "Rhodes", dongs: ["Medieval Town", "Rhodes Town"] },
        { name: "Mykonos", dongs: ["Chora"] },
        { name: "Santorini", dongs: ["Fira", "Oia"] },
      ],
    },
    {
      name: "Ionian Islands",
      shortName: "Ionian",
      gunguList: [
        { name: "Corfu (Kerkyra)", dongs: ["Old Town"] },
        { name: "Zakynthos", dongs: ["Town"] },
      ],
    },
    {
      name: "Western Macedonia",
      shortName: "W. Macedonia",
      gunguList: [
        { name: "Kozani", dongs: ["Center"] },
        { name: "Kastoria", dongs: ["Center"] },
      ],
    },
    {
      name: "North Aegean",
      shortName: "N. Aegean",
      gunguList: [
        { name: "Lesbos (Mytilene)", dongs: ["Center"] },
        { name: "Chios", dongs: ["Town"] },
      ],
    },
  ],
  TR: [
    {
      name: "İstanbul",
      shortName: "İstanbul",
      gunguList: [
        { name: "Avrupa (European Side)", dongs: ["Beyoğlu (Taksim)", "Şişli", "Beşiktaş", "Fatih", "Bakırköy", "Sarıyer"] },
        { name: "Anadolu (Asian Side)", dongs: ["Kadıköy", "Üsküdar", "Ataşehir", "Maltepe"] },
      ],
    },
    {
      name: "Ankara",
      shortName: "Ankara",
      gunguList: [
        { name: "Çankaya", dongs: ["Kızılay", "Tunalı", "Gaziosmanpaşa", "Balgat"] },
        { name: "Yenimahalle", dongs: ["Batıkent"] },
      ],
    },
    {
      name: "İzmir",
      shortName: "İzmir",
      gunguList: [
        { name: "Konak", dongs: ["Alsancak", "Kordon"] },
        { name: "Karşıyaka", dongs: ["Bostanlı"] },
        { name: "Bornova", dongs: ["Ege University"] },
      ],
    },
    {
      name: "Antalya",
      shortName: "Antalya",
      gunguList: [
        { name: "Muratpaşa", dongs: ["Kaleiçi (Old Town)", "Lara"] },
        { name: "Konyaaltı", dongs: ["Plaj Area"] },
        { name: "Alanya", dongs: ["Merkez"] },
      ],
    },
    {
      name: "Bursa",
      shortName: "Bursa",
      gunguList: [
        { name: "Nilüfer", dongs: ["Görükle", "FSM"] },
        { name: "Osmangazi", dongs: ["Heykel"] },
      ],
    },
    {
      name: "Adana",
      shortName: "Adana",
      gunguList: [
        { name: "Seyhan", dongs: ["Merkez"] },
        { name: "Çukurova", dongs: ["Barajyolu"] },
      ],
    },
    {
      name: "Gaziantep",
      shortName: "Gaziantep",
      gunguList: [
        { name: "Şahinbey", dongs: ["Merkez"] },
        { name: "Şehitkamil", dongs: ["Merkez"] },
      ],
    },
    {
      name: "Konya",
      shortName: "Konya",
      gunguList: [
        { name: "Selçuklu", dongs: ["Merkez"] },
        { name: "Meram", dongs: ["Merkez"] },
      ],
    },
    {
      name: "Kocaeli",
      shortName: "Kocaeli",
      gunguList: [
        { name: "İzmit", dongs: ["Merkez"] },
        { name: "Gebze", dongs: ["Merkez"] },
      ],
    },
    {
      name: "Mersin",
      shortName: "Mersin",
      gunguList: [
        { name: "Yenişehir", dongs: ["Merkez"] },
        { name: "Mezitli", dongs: ["Merkez"] },
      ],
    },
    {
      name: "Diyarbakır",
      shortName: "Diyarbakır",
      gunguList: [
        { name: "Kayapınar", dongs: ["Merkez"] },
        { name: "Sur", dongs: ["İçkale"] },
      ],
    },
    {
      name: "Kayseri",
      shortName: "Kayseri",
      gunguList: [
        { name: "Melikgazi", dongs: ["Merkez"] },
        { name: "Kocasinan", dongs: ["Merkez"] },
      ],
    },
    {
      name: "Eskişehir",
      shortName: "Eskişehir",
      gunguList: [
        { name: "Odunpazarı", dongs: ["Tarihi Bölge"] },
        { name: "Tepebaşı", dongs: ["Merkez"] },
      ],
    },
    {
      name: "Samsun",
      shortName: "Samsun",
      gunguList: [
        { name: "Atakum", dongs: ["Sahil"] },
        { name: "İlkadım", dongs: ["Merkez"] },
      ],
    },
    {
      name: "Denizli",
      shortName: "Denizli",
      gunguList: [
        { name: "Pamukkale", dongs: ["Merkez"] },
        { name: "Merkezefendi", dongs: ["Merkez"] },
      ],
    },
    {
      name: "Şanlıurfa",
      shortName: "Şanlıurfa",
      gunguList: [
        { name: "Haliliye", dongs: ["Merkez"] },
        { name: "Eyyübiye", dongs: ["Balıklıgöl"] },
      ],
    },
    {
      name: "Muğla",
      shortName: "Muğla",
      gunguList: [
        { name: "Bodrum", dongs: ["Merkez"] },
        { name: "Fethiye", dongs: ["Merkez"] },
        { name: "Marmaris", dongs: ["Merkez"] },
      ],
    },
    {
      name: "Trabzon",
      shortName: "Trabzon",
      gunguList: [
        { name: "Ortahisar", dongs: ["Merkez", "Meydan"] },
      ],
    },
    {
      name: "Tekirdağ",
      shortName: "Tekirdağ",
      gunguList: [
        { name: "Süleymanpaşa", dongs: ["Merkez"] },
        { name: "Çorlu", dongs: ["Merkez"] },
      ],
    },
    {
      name: "Balıkesir",
      shortName: "Balıkesir",
      gunguList: [
        { name: "Altıeylül", dongs: ["Merkez"] },
        { name: "Karesi", dongs: ["Merkez"] },
      ],
    },
    {
      name: "Aydın",
      shortName: "Aydın",
      gunguList: [
        { name: "Efeler", dongs: ["Merkez"] },
        { name: "Kuşadası", dongs: ["Merkez"] },
      ],
    },
  ],
  RU: [
    {
      name: "Москва (Moscow)",
      shortName: "Москва",
      gunguList: [
        { name: "Центральный АО", dongs: ["Тверской", "Арбат", "Басманный", "Замоскворечье", "Хамовники", "Пресненский"] },
        { name: "Северный АО", dongs: ["Аэропорт", "Беговой", "Сокол", "Хорошёвский"] },
        { name: "Юго-Западный АО", dongs: ["Гагаринский", "Академический", "Ломоносовский"] },
        { name: "Западный АО", dongs: ["Раменки", "Дорогомилово"] },
      ],
    },
    {
      name: "Санкт-Петербург (St. Petersburg)",
      shortName: "СПб",
      gunguList: [
        { name: "Центральный район", dongs: ["Дворцовый", "Смольнинское", "Литейный", "Владимирский"] },
        { name: "Адмиралтейский район", dongs: ["Коломна", "Сенной", "Екатерингофский"] },
        { name: "Василеостровский район", dongs: ["Васильевский", "Гавань", "Морской"] },
        { name: "Петроградский район", dongs: ["Посадский", "Аптекарский"] },
      ],
    },
    {
      name: "Московская область (Moscow Oblast)",
      shortName: "Мос. обл.",
      gunguList: [
        { name: "Красногорск", dongs: ["Павшинская Пойма"] },
        { name: "Одинцово", dongs: ["Сколково"] },
        { name: "Химки", dongs: ["Центр"] },
        { name: "Балашиха", dongs: ["Центр"] },
      ],
    },
    {
      name: "Новосибирская область (Novosibirsk)",
      shortName: "Новосибирск",
      gunguList: [
        { name: "Новосибирск", dongs: ["Центральный", "Железнодорожный", "Академгородок"] },
      ],
    },
    {
      name: "Свердловская область (Yekaterinburg)",
      shortName: "Екатеринбург",
      gunguList: [
        { name: "Екатеринбург", dongs: ["Ленинский", "Кировский", "Верх-Исетский"] },
      ],
    },
    {
      name: "Татарстан (Tatarstan)",
      shortName: "Татарстан",
      gunguList: [
        { name: "Казань", dongs: ["Вахитовский (Кремль)", "Ново-Савиновский", "Советский"] },
      ],
    },
    {
      name: "Нижегородская область (Nizhny Novgorod)",
      shortName: "Нижний Новгород",
      gunguList: [
        { name: "Нижний Новгород", dongs: ["Нижегородский", "Советский"] },
      ],
    },
    {
      name: "Краснодарский край (Krasnodar / Sochi)",
      shortName: "Краснодар",
      gunguList: [
        { name: "Краснодар", dongs: ["Центральный", "Фестивальный"] },
        { name: "Сочи", dongs: ["Центральный", "Адлерский", "Красная Поляна"] },
      ],
    },
    {
      name: "Самарская область (Samara)",
      shortName: "Самара",
      gunguList: [
        { name: "Самара", dongs: ["Ленинский", "Самарский"] },
        { name: "Тольятти", dongs: ["Автозаводский"] },
      ],
    },
    {
      name: "Приморский край (Vladivostok)",
      shortName: "Владивосток",
      gunguList: [
        { name: "Владивосток", dongs: ["Фрунзенский", "Ленинский", "Первореченский"] },
      ],
    },
    {
      name: "Хабаровский край (Khabarovsk)",
      shortName: "Хабаровск",
      gunguList: [
        { name: "Хабаровск", dongs: ["Центральный", "Кировский"] },
      ],
    },
    {
      name: "Челябинская область (Chelyabinsk)",
      shortName: "Челябинск",
      gunguList: [
        { name: "Челябинск", dongs: ["Центральный", "Советский"] },
      ],
    },
    {
      name: "Ростовская область (Rostov-on-Don)",
      shortName: "Ростов",
      gunguList: [
        { name: "Ростов-на-Дону", dongs: ["Ленинский", "Кировский"] },
      ],
    },
    {
      name: "Башкортостан (Ufa)",
      shortName: "Уфа",
      gunguList: [
        { name: "Уфа", dongs: ["Кировский", "Ленинский"] },
      ],
    },
    {
      name: "Воронежская область (Voronezh)",
      shortName: "Воронеж",
      gunguList: [
        { name: "Воронеж", dongs: ["Центральный"] },
      ],
    },
    {
      name: "Пермский край (Perm)",
      shortName: "Пермь",
      gunguList: [
        { name: "Пермь", dongs: ["Ленинский"] },
      ],
    },
    {
      name: "Красноярский край (Krasnoyarsk)",
      shortName: "Красноярск",
      gunguList: [
        { name: "Красноярск", dongs: ["Центральный", "Советский"] },
      ],
    },
    {
      name: "Калининградская область (Kaliningrad)",
      shortName: "Калининград",
      gunguList: [
        { name: "Калининград", dongs: ["Ленинградский", "Центральный"] },
      ],
    },
    {
      name: "Иркутская область (Irkutsk / Baikal)",
      shortName: "Иркутск",
      gunguList: [
        { name: "Иркутск", dongs: ["Правобережный"] },
      ],
    },
    {
      name: "Тюменская область (Tyumen)",
      shortName: "Тюмень",
      gunguList: [
        { name: "Тюмень", dongs: ["Центральный"] },
      ],
    },
  ],
  UA: [
    {
      name: "Київ (Kyiv City)",
      shortName: "Київ",
      gunguList: [
        { name: "Шевченківський район", dongs: ["Хрещатик", "Лук'янівка", "Сирець"] },
        { name: "Печерський район", dongs: ["Печерськ", "Липки"] },
        { name: "Голосіївський район", dongs: ["Голосієво", "Теремки"] },
        { name: "Оболонський район", dongs: ["Оболонь"] },
      ],
    },
    {
      name: "Львівська область (Lviv)",
      shortName: "Львів",
      gunguList: [
        { name: "Львів", dongs: ["Галицький (Старе Місто)", "Личаківський", "Франківський"] },
      ],
    },
    {
      name: "Одеська область (Odesa)",
      shortName: "Одеса",
      gunguList: [
        { name: "Одеса", dongs: ["Приморський (Дерибасівська)", "Київський", "Малиновський"] },
      ],
    },
    {
      name: "Харківська область (Kharkiv)",
      shortName: "Харків",
      gunguList: [
        { name: "Харків", dongs: ["Шевченківський", "Київський", "Салтівський"] },
      ],
    },
    {
      name: "Дніпропетровська область (Dnipro)",
      shortName: "Дніпро",
      gunguList: [
        { name: "Дніпро", dongs: ["Соборний", "Центральний", "Шевченківський"] },
      ],
    },
    {
      name: "Київська область (Kyiv Oblast)",
      shortName: "Київ. обл.",
      gunguList: [
        { name: "Ірпінь", dongs: ["Центр"] },
        { name: "Буча", dongs: ["Центр"] },
        { name: "Бровари", dongs: ["Центр"] },
        { name: "Біла Церква", dongs: ["Центр"] },
      ],
    },
    {
      name: "Запорізька область (Zaporizhzhia)",
      shortName: "Запоріжжя",
      gunguList: [
        { name: "Запоріжжя", dongs: ["Вознесенівський", "Олександрівський"] },
      ],
    },
    {
      name: "Вінницька область (Vinnytsia)",
      shortName: "Вінниця",
      gunguList: [
        { name: "Вінниця", dongs: ["Центр", "Вишенька"] },
      ],
    },
    {
      name: "Полтавська область (Poltava)",
      shortName: "Полтава",
      gunguList: [
        { name: "Полтава", dongs: ["Шевченківський", "Київський"] },
      ],
    },
    {
      name: "Івано-Франківська область",
      shortName: "Івано-Франківськ",
      gunguList: [
        { name: "Івано-Франківськ", dongs: ["Центр"] },
      ],
    },
    {
      name: "Чернівецька область (Chernivtsi)",
      shortName: "Чернівці",
      gunguList: [
        { name: "Чернівці", dongs: ["Центр"] },
      ],
    },
    {
      name: "Тернопільська область (Ternopil)",
      shortName: "Тернопіль",
      gunguList: [
        { name: "Тернопіль", dongs: ["Центр"] },
      ],
    },
    {
      name: "Закарпатська область (Uzhhorod)",
      shortName: "Ужгород",
      gunguList: [
        { name: "Ужгород", dongs: ["Центр"] },
      ],
    },
    {
      name: "Волинська область (Lutsk)",
      shortName: "Луцьк",
      gunguList: [
        { name: "Луцьк", dongs: ["Центр"] },
      ],
    },
    {
      name: "Рівненська область (Rivne)",
      shortName: "Рівне",
      gunguList: [
        { name: "Рівне", dongs: ["Центр"] },
      ],
    },
    {
      name: "Житомирська область (Zhytomyr)",
      shortName: "Житомир",
      gunguList: [
        { name: "Житомир", dongs: ["Центр"] },
      ],
    },
    {
      name: "Хмельницька область (Khmelnytskyi)",
      shortName: "Хмельницький",
      gunguList: [
        { name: "Хмельницький", dongs: ["Центр"] },
      ],
    },
    {
      name: "Черкаська область (Cherkasy)",
      shortName: "Черкаси",
      gunguList: [
        { name: "Черкаси", dongs: ["Центр"] },
      ],
    },
    {
      name: "Миколаївська область (Mykolaiv)",
      shortName: "Миколаїв",
      gunguList: [
        { name: "Миколаїв", dongs: ["Центральний"] },
      ],
    },
    {
      name: "Чернігівська область (Chernihiv)",
      shortName: "Чернігів",
      gunguList: [
        { name: "Чернігів", dongs: ["Деснянський"] },
      ],
    },
    {
      name: "Сумська область (Sumy)",
      shortName: "Суми",
      gunguList: [
        { name: "Суми", dongs: ["Центр"] },
      ],
    },
    {
      name: "Кіровоградська область",
      shortName: "Кропивницький",
      gunguList: [
        { name: "Кропивницький", dongs: ["Фортечний"] },
      ],
    },
    {
      name: "Херсонська область (Kherson)",
      shortName: "Херсон",
      gunguList: [
        { name: "Херсон", dongs: ["Суворовський"] },
      ],
    },
    {
      name: "Донецька область (Donetsk)",
      shortName: "Донецьк",
      gunguList: [
        { name: "Краматорськ", dongs: ["Центр"] },
        { name: "Маріуполь", dongs: ["Центральний"] },
      ],
    },
    {
      name: "Луганська область (Luhansk)",
      shortName: "Луганськ",
      gunguList: [
        { name: "Сєвєродонецьк", dongs: ["Центр"] },
      ],
    },
    {
      name: "Автономна Республіка Крим",
      shortName: "Крим",
      gunguList: [
        { name: "Сімферополь", dongs: ["Центр"] },
        { name: "Севастополь", dongs: ["Ленінський"] },
      ],
    },
  ],
  UZ: [
    {
      name: "Toshkent shahri (Tashkent City)",
      shortName: "Toshkent",
      gunguList: [
        { name: "Mirobod tumani", dongs: ["Oybek", "Gospitalny", "Mirobod"] },
        { name: "Yunusobod tumani", dongs: ["Yunusobod", "Amir Temur", "Bodomzor"] },
        { name: "Yakkasaroy tumani", dongs: ["Bobur", "Shota Rustaveli", "Kushbegi"] },
        { name: "Shayxontohur tumani", dongs: ["Chorsu", "Navoiy"] },
        { name: "Mirzo Ulug'bek tumani", dongs: ["Buyuk Ipak Yo'li"] },
      ],
    },
    {
      name: "Samarqand viloyati",
      shortName: "Samarqand",
      gunguList: [
        { name: "Samarqand shahri", dongs: ["Registon", "Siyob", "Universitet"] },
        { name: "Urgut tumani", dongs: ["Urgut"] },
      ],
    },
    {
      name: "Toshkent viloyati",
      shortName: "Toshkent vil.",
      gunguList: [
        { name: "Chirchiq shahri", dongs: ["Markaz"] },
        { name: "Olmaliq shahri", dongs: ["Markaz"] },
        { name: "Angren shahri", dongs: ["Markaz"] },
        { name: "Bekobod shahri", dongs: ["Markaz"] },
      ],
    },
    {
      name: "Farg'ona viloyati",
      shortName: "Farg'ona",
      gunguList: [
        { name: "Farg'ona shahri", dongs: ["Markaz"] },
        { name: "Qo'qon shahri", dongs: ["Markaz"] },
        { name: "Marg'ilon shahri", dongs: ["Markaz"] },
      ],
    },
    {
      name: "Andijon viloyati",
      shortName: "Andijon",
      gunguList: [
        { name: "Andijon shahri", dongs: ["Bobur maydoni", "Yangi shahar"] },
        { name: "Asaka tumani", dongs: ["Asaka"] },
      ],
    },
    {
      name: "Namangan viloyati",
      shortName: "Namangan",
      gunguList: [
        { name: "Namangan shahri", dongs: ["Davlatobod", "Yangi Namangan"] },
      ],
    },
    {
      name: "Buxoro viloyati",
      shortName: "Buxoro",
      gunguList: [
        { name: "Buxoro shahri", dongs: ["Eski shahar (Ark)", "Markaz"] },
        { name: "G'ijduvon tumani", dongs: ["G'ijduvon"] },
      ],
    },
    {
      name: "Qashqadaryo viloyati",
      shortName: "Qashqadaryo",
      gunguList: [
        { name: "Qarshi shahri", dongs: ["Markaz"] },
        { name: "Shahrisabz shahri", dongs: ["Oqsaroy"] },
      ],
    },
    {
      name: "Surxondaryo viloyati",
      shortName: "Surxondaryo",
      gunguList: [
        { name: "Termiz shahri", dongs: ["Markaz"] },
        { name: "Denov tumani", dongs: ["Denov"] },
      ],
    },
    {
      name: "Xorazm viloyati",
      shortName: "Xorazm",
      gunguList: [
        { name: "Urganch shahri", dongs: ["Markaz"] },
        { name: "Xiva shahri", dongs: ["Ichan Qal'a"] },
      ],
    },
    {
      name: "Jizzax viloyati",
      shortName: "Jizzax",
      gunguList: [
        { name: "Jizzax shahri", dongs: ["Markaz"] },
        { name: "Zomin tumani", dongs: ["Zomin"] },
      ],
    },
    {
      name: "Navoiy viloyati",
      shortName: "Navoiy",
      gunguList: [
        { name: "Navoiy shahri", dongs: ["Markaz"] },
        { name: "Zarafshon shahri", dongs: ["Markaz"] },
      ],
    },
    {
      name: "Sirdaryo viloyati",
      shortName: "Sirdaryo",
      gunguList: [
        { name: "Guliston shahri", dongs: ["Markaz"] },
        { name: "Yangiyer shahri", dongs: ["Markaz"] },
      ],
    },
    {
      name: "Qoraqalpog'iston Respublikasi",
      shortName: "Qoraqalpoq",
      gunguList: [
        { name: "Nukus shahri", dongs: ["Markaz", "Savitskiy muzeyi"] },
        { name: "Xo'jayli tumani", dongs: ["Xo'jayli"] },
      ],
    },
  ],
  KZ: [
    {
      name: "Астана (Astana City)",
      shortName: "Astana",
      gunguList: [
        { name: "Есіл ауданы (Yesil)", dongs: ["Мәңгілік Ел", "Нұржол бульвары", "EXPO"] },
        { name: "Алматы ауданы (Almaty)", dongs: ["Тәуелсіздік"] },
        { name: "Байқоңыр ауданы (Baikonur)", dongs: ["Орталық"] },
        { name: "Сарыарқа ауданы (Saryarka)", dongs: ["Ескі қала"] },
      ],
    },
    {
      name: "Алматы (Almaty City)",
      shortName: "Almaty",
      gunguList: [
        { name: "Медеу ауданы (Medeu)", dongs: ["Достық", "Медеу"] },
        { name: "Бостандық ауданы (Bostandyk)", dongs: ["Әл-Фараби", "Mega"] },
        { name: "Алмалы ауданы (Almaly)", dongs: ["Арбат", "Панфилов"] },
        { name: "Әуезов ауданы (Auezov)", dongs: ["Сайран"] },
      ],
    },
    {
      name: "Шымкент (Shymkent City)",
      shortName: "Shymkent",
      gunguList: [
        { name: "Әл-Фараби ауданы", dongs: ["Орталық"] },
        { name: "Абай ауданы", dongs: ["Орталық"] },
        { name: "Еңбекші ауданы", dongs: ["Орталық"] },
      ],
    },
    {
      name: "Қарағанды облысы (Karaganda)",
      shortName: "Қарағанды",
      gunguList: [
        { name: "Қарағанды қаласы", dongs: ["Қазыбек би", "Бұқар жырау"] },
        { name: "Теміртау қаласы", dongs: ["Орталық"] },
      ],
    },
    {
      name: "Ақтөбе облысы (Aktobe)",
      shortName: "Ақтөбе",
      gunguList: [
        { name: "Ақтөбе қаласы", dongs: ["Астана ауданы", "Алматы ауданы"] },
      ],
    },
    {
      name: "Атырау облысы (Atyrau)",
      shortName: "Атырау",
      gunguList: [
        { name: "Атырау қаласы", dongs: ["Европейская сторона", "Азиатская сторона"] },
      ],
    },
    {
      name: "Маңғыстау облысы (Aktau)",
      shortName: "Маңғыстау",
      gunguList: [
        { name: "Ақтау қаласы", dongs: ["14-шағын аудан", "Теңіз жағалауы"] },
      ],
    },
    {
      name: "Павлодар облысы (Pavlodar)",
      shortName: "Павлодар",
      gunguList: [
        { name: "Павлодар қаласы", dongs: ["Орталық"] },
        { name: "Екібастұз қаласы", dongs: ["Орталық"] },
      ],
    },
    {
      name: "Шығыс Қазақстан (East Kaz.)",
      shortName: "ШҚО",
      gunguList: [
        { name: "Өскемен қаласы", dongs: ["Орталық"] },
        { name: "Риддер қаласы", dongs: ["Орталық"] },
      ],
    },
    {
      name: "Абай облысы (Abai)",
      shortName: "Абай",
      gunguList: [
        { name: "Семей қаласы", dongs: ["Орталық"] },
      ],
    },
    {
      name: "Қостанай облысы (Kostanay)",
      shortName: "Қостанай",
      gunguList: [
        { name: "Қостанай қаласы", dongs: ["Орталық"] },
        { name: "Рудный қаласы", dongs: ["Орталық"] },
      ],
    },
    {
      name: "Солтүстік Қазақстан (North Kaz.)",
      shortName: "СҚО",
      gunguList: [
        { name: "Петропавл қаласы", dongs: ["Орталық"] },
      ],
    },
    {
      name: "Ақмола облысы (Aqmola)",
      shortName: "Ақмола",
      gunguList: [
        { name: "Көкшетау қаласы", dongs: ["Орталық"] },
        { name: "Бурабай ауданы", dongs: ["Бурабай (Боровое)"] },
      ],
    },
    {
      name: "Батыс Қазақстан (West Kaz.)",
      shortName: "БҚО",
      gunguList: [
        { name: "Орал қаласы (Uralsk)", dongs: ["Орталық"] },
      ],
    },
    {
      name: "Жамбыл облысы (Zhambyl)",
      shortName: "Жамбыл",
      gunguList: [
        { name: "Тараз қаласы", dongs: ["Орталық"] },
      ],
    },
    {
      name: "Түркістан облысы (Turkistan)",
      shortName: "Түркістан",
      gunguList: [
        { name: "Түркістан қаласы", dongs: ["Қожа Ахмет Ясауи кесенесі"] },
        { name: "Кентау қаласы", dongs: ["Орталық"] },
      ],
    },
    {
      name: "Қызылорда облысы (Kyzylorda)",
      shortName: "Қызылорда",
      gunguList: [
        { name: "Қызылорда қаласы", dongs: ["Орталық"] },
        { name: "Байқоңыр қаласы", dongs: ["Орталық"] },
      ],
    },
    {
      name: "Алматы облысы (Almaty Reg.)",
      shortName: "Алматы обл.",
      gunguList: [
        { name: "Қонаев қаласы", dongs: ["Орталық"] },
        { name: "Талғар қаласы", dongs: ["Орталық"] },
        { name: "Қаскелең қаласы", dongs: ["Орталық"] },
      ],
    },
    {
      name: "Жетісу облысы (Zhetysu)",
      shortName: "Жетісу",
      gunguList: [
        { name: "Талдықорған қаласы", dongs: ["Орталық"] },
      ],
    },
    {
      name: "Ұлытау облысы (Ulytau)",
      shortName: "Ұлытау",
      gunguList: [
        { name: "Жезқазған қаласы", dongs: ["Орталық"] },
        { name: "Сәтбаев қаласы", dongs: ["Орталық"] },
      ],
    },
  ],
  TH: [
    {
      name: "กรุงเทพมหานคร (Bangkok)",
      shortName: "Bangkok",
      gunguList: [
        { name: "ปทุมวัน (Pathum Wan)", dongs: ["สยาม (Siam)", "ลุมพินี (Lumphini)", "รองเมือง"] },
        { name: "วัฒนา (Watthana)", dongs: ["คลองเตยเหนือ (Asok/Phrom Phong)", "ทองหล่อ (Thong Lo)", "เอกมัย (Ekkamai)"] },
        { name: "ห้วยขวาง (Huai Khwang)", dongs: ["ห้วยขวาง", "รัชดาภิเษก", "บางกะปิ"] },
        { name: "บางรัก (Bang Rak)", dongs: ["สีลม (Silom)", "สุริยวงศ์"] },
        { name: "คลองเตย (Khlong Toei)", dongs: ["พระโขนง", "คลองเตย"] },
      ],
    },
    {
      name: "เชียงใหม่ (Chiang Mai)",
      shortName: "Chiang Mai",
      gunguList: [
        { name: "เมืองเชียงใหม่", dongs: ["นิมมานเหมินท์", "ช้างคลาน (Night Bazaar)", "คูเมือง (Old City)"] },
        { name: "หางดง", dongs: ["หางดง"] },
      ],
    },
    {
      name: "ภูเก็ต (Phuket)",
      shortName: "Phuket",
      gunguList: [
        { name: "เมืองภูเก็ต", dongs: ["ย่านเมืองเก่า (Old Town)", "ป่าตอง (Patong)"] },
        { name: "ถลาง", dongs: ["บางเทา (Laguna)", "เชิงทะเล"] },
        { name: "กะทู้", dongs: ["กมลา"] },
      ],
    },
    {
      name: "ชลบุรี (Chonburi / Pattaya)",
      shortName: "Chonburi",
      gunguList: [
        { name: "บางละมุง (Pattaya)", dongs: ["พัทยากลาง", "พัทยาเหนือ", "หาดจอมเทียน", "นาเกลือ"] },
        { name: "ศรีราชา (Si Racha)", dongs: ["ศรีราชา"] },
      ],
    },
    {
      name: "นนทบุรี (Nonthaburi)",
      shortName: "Nonthaburi",
      gunguList: [
        { name: "เมืองนนทบุรี", dongs: ["บางเขน", "ตลาดขวัญ"] },
        { name: "ปากเกร็ด", dongs: ["แจ้งวัฒนะ", "เมืองทองธานี"] },
      ],
    },
    {
      name: "สมุทรปราการ (Samut Prakan)",
      shortName: "Samut Prakan",
      gunguList: [
        { name: "เมืองสมุทรปราการ", dongs: ["สำโรง", "ปากน้ำ"] },
        { name: "บางพลี", dongs: ["สนามบินสุวรรณภูมิ"] },
      ],
    },
    {
      name: "ปทุมธานี (Pathum Thani)",
      shortName: "Pathum Thani",
      gunguList: [
        { name: "คลองหลวง", dongs: ["รังสิต"] },
        { name: "เมืองปทุมธานี", dongs: ["บางปรอก"] },
      ],
    },
    {
      name: "นครราชสีมา (Nakhon Ratchasima / Korat)",
      shortName: "Korat",
      gunguList: [
        { name: "เมืองนครราชสีมา", dongs: ["ในเมือง", "โพธิ์กลาง"] },
        { name: "ปากช่อง (Khao Yai)", dongs: ["หมูสี", "ปากช่อง"] },
      ],
    },
    {
      name: "ขอนแก่น (Khon Kaen)",
      shortName: "Khon Kaen",
      gunguList: [
        { name: "เมืองขอนแก่น", dongs: ["ในเมือง", "ม.ขอนแก่น"] },
      ],
    },
    {
      name: "สงขลา (Songkhla / Hat Yai)",
      shortName: "Songkhla",
      gunguList: [
        { name: "หาดใหญ่ (Hat Yai)", dongs: ["หาดใหญ่ใน", "คอหงส์"] },
        { name: "เมืองสงขลา", dongs: ["บ่อยาง"] },
      ],
    },
    {
      name: "สุราษฎร์ธานี (Surat Thani / Samui)",
      shortName: "Surat Thani",
      gunguList: [
        { name: "เกาะสมุย (Koh Samui)", dongs: ["เฉวง", "ละไม", "บ่อผุด"] },
        { name: "เกาะพะงัน", dongs: ["ท้องศาลา"] },
      ],
    },
    {
      name: "กระบี่ (Krabi)",
      shortName: "Krabi",
      gunguList: [
        { name: "เมืองกระบี่", dongs: ["อ่าวนาง", "ไร่เลย์", "ในเมือง"] },
      ],
    },
    {
      name: "อุดรธานี (Udon Thani)",
      shortName: "Udon Thani",
      gunguList: [
        { name: "เมืองอุดรธานี", dongs: ["หมากแข้ง", "หนองประจักษ์"] },
      ],
    },
    {
      name: "ระยอง (Rayong)",
      shortName: "Rayong",
      gunguList: [
        { name: "เมืองระยอง", dongs: ["เนินพระ", "ท่าประดู่"] },
        { name: "เกาะเสม็ด", dongs: ["เกาะเสม็ด"] },
      ],
    },
    {
      name: "พระนครศรีอยุธยา (Ayutthaya)",
      shortName: "Ayutthaya",
      gunguList: [
        { name: "พระนครศรีอยุธยา", dongs: ["ประตูชัย", "หัวรอ"] },
      ],
    },
    {
      name: "ประจวบคีรีขันธ์ (Hua Hin)",
      shortName: "Hua Hin",
      gunguList: [
        { name: "หัวหิน (Hua Hin)", dongs: ["หัวหิน", "หนองแก", "เขาตะเกียบ"] },
      ],
    },
    {
      name: "เชียงราย (Chiang Rai)",
      shortName: "Chiang Rai",
      gunguList: [
        { name: "เมืองเชียงราย", dongs: ["เวียง", "รอบเวียง"] },
      ],
    },
    {
      name: "อุบลราชธานี (Ubon Ratchathani)",
      shortName: "Ubon",
      gunguList: [
        { name: "เมืองอุบลราชธานี", dongs: ["ในเมือง"] },
      ],
    },
    {
      name: "นครศรีธรรมราช (Nakhon Si Thammarat)",
      shortName: "Nakhon Si",
      gunguList: [
        { name: "เมืองนครศรีธรรมราช", dongs: ["ในเมือง"] },
      ],
    },
    {
      name: "พิษณุโลก (Phitsanulok)",
      shortName: "Phitsanulok",
      gunguList: [
        { name: "เมืองพิษณุโลก", dongs: ["ในเมือง"] },
      ],
    },
  ],
  IN: [
    {
      name: "Delhi (NCT)",
      shortName: "Delhi",
      gunguList: [
        { name: "New Delhi", dongs: ["Connaught Place", "Chanakyapuri", "Vasant Kunj", "Hauz Khas", "Lajpat Nagar"] },
        { name: "South Delhi", dongs: ["Saket", "Greater Kailash"] },
        { name: "North Delhi", dongs: ["Civil Lines"] },
      ],
    },
    {
      name: "Maharashtra",
      shortName: "Maharashtra",
      gunguList: [
        { name: "Mumbai", dongs: ["Bandra", "Colaba", "Andheri", "Juhu", "Nariman Point", "Powai"] },
        { name: "Pune", dongs: ["Koregaon Park", "Hinjawadi", "Kothrud"] },
        { name: "Thane", dongs: ["Ghubunder Road"] },
      ],
    },
    {
      name: "Karnataka",
      shortName: "Karnataka",
      gunguList: [
        { name: "Bengaluru (Bangalore)", dongs: ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Electronic City", "MG Road"] },
        { name: "Mysuru", dongs: ["Gokulam"] },
      ],
    },
    {
      name: "Tamil Nadu",
      shortName: "Tamil Nadu",
      gunguList: [
        { name: "Chennai", dongs: ["T. Nagar", "Adyar", "Mylapore", "Anna Nagar", "OMR (IT Corridor)"] },
        { name: "Coimbatore", dongs: ["RS Puram"] },
      ],
    },
    {
      name: "Telangana",
      shortName: "Telangana",
      gunguList: [
        { name: "Hyderabad", dongs: ["Hitec City", "Gachibowli", "Jubilee Hills", "Banjara Hills", "Secunderabad"] },
      ],
    },
    {
      name: "Gujarat",
      shortName: "Gujarat",
      gunguList: [
        { name: "Ahmedabad", dongs: ["Navrangpura", "SG Highway", "Bodakdev"] },
        { name: "Surat", dongs: ["Athwa"] },
        { name: "Vadodara", dongs: ["Alkapuri"] },
      ],
    },
    {
      name: "West Bengal",
      shortName: "West Bengal",
      gunguList: [
        { name: "Kolkata", dongs: ["Park Street", "Salt Lake City", "New Town", "Alipore", "Ballygunge"] },
      ],
    },
    {
      name: "Uttar Pradesh",
      shortName: "Uttar Pradesh",
      gunguList: [
        { name: "Noida", dongs: ["Sector 18", "Sector 62", "Sector 150"] },
        { name: "Lucknow", dongs: ["Hazratganj", "Gomti Nagar"] },
        { name: "Agra", dongs: ["Tajganj"] },
      ],
    },
    {
      name: "Haryana",
      shortName: "Haryana",
      gunguList: [
        { name: "Gurugram (Gurgaon)", dongs: ["Cyber City", "Golf Course Road", "DLF Phase 1-5", "Sohna Road"] },
        { name: "Faridabad", dongs: ["Sector 15"] },
      ],
    },
    {
      name: "Rajasthan",
      shortName: "Rajasthan",
      gunguList: [
        { name: "Jaipur", dongs: ["Pink City (C-Scheme)", "Malviya Nagar", "Vaishali Nagar"] },
        { name: "Udaipur", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Kerala",
      shortName: "Kerala",
      gunguList: [
        { name: "Kochi (Cochin)", dongs: ["Fort Kochi", "Marine Drive", "Kakkanad"] },
        { name: "Thiruvananthapuram", dongs: ["Technopark"] },
      ],
    },
    {
      name: "Punjab",
      shortName: "Punjab",
      gunguList: [
        { name: "Amritsar", dongs: ["Golden Temple Area", "Ranjit Avenue"] },
        { name: "Ludhiana", dongs: ["Civil Lines"] },
      ],
    },
    {
      name: "Goa",
      shortName: "Goa",
      gunguList: [
        { name: "North Goa", dongs: ["Panaji", "Candolim", "Calangute", "Anjuna"] },
        { name: "South Goa", dongs: ["Margao", "Colva"] },
      ],
    },
    {
      name: "Chandigarh",
      shortName: "Chandigarh",
      gunguList: [
        { name: "Chandigarh City", dongs: ["Sector 17", "Sector 35", "Sector 8"] },
      ],
    },
    {
      name: "Madhya Pradesh",
      shortName: "MP",
      gunguList: [
        { name: "Indore", dongs: ["Vijay Nagar", "Palasia"] },
        { name: "Bhopal", dongs: ["Arera Colony"] },
      ],
    },
    {
      name: "Odisha",
      shortName: "Odisha",
      gunguList: [
        { name: "Bhubaneswar", dongs: ["Saheed Nagar", "Patia"] },
      ],
    },
    {
      name: "Bihar",
      shortName: "Bihar",
      gunguList: [
        { name: "Patna", dongs: ["Fraser Road", "Kankarbagh"] },
      ],
    },
    {
      name: "Assam",
      shortName: "Assam",
      gunguList: [
        { name: "Guwahati", dongs: ["GS Road", "Pan Bazaar"] },
      ],
    },
    {
      name: "Jammu and Kashmir",
      shortName: "J&K",
      gunguList: [
        { name: "Srinagar", dongs: ["Lal Chowk", "Dal Lake"] },
        { name: "Jammu", dongs: ["Gandhi Nagar"] },
      ],
    },
    {
      name: "Uttarakhand",
      shortName: "Uttarakhand",
      gunguList: [
        { name: "Dehradun", dongs: ["Rajpur Road"] },
        { name: "Rishikesh", dongs: ["Tapovan"] },
      ],
    },
  ],
  PK: [
    {
      name: "Islamabad Capital Territory",
      shortName: "Islamabad",
      gunguList: [
        { name: "Islamabad", dongs: ["Sector F-6", "Sector F-7", "Sector F-8", "Sector G-9", "Blue Area", "DHA Islamabad"] },
      ],
    },
    {
      name: "Punjab",
      shortName: "Punjab",
      gunguList: [
        { name: "Lahore", dongs: ["Gulberg", "DHA Lahore", "Model Town", "Johar Town", "Mall Road"] },
        { name: "Rawalpindi", dongs: ["Saddar", "Bahria Town"] },
        { name: "Faisalabad", dongs: ["D Ground"] },
      ],
    },
    {
      name: "Sindh",
      shortName: "Sindh",
      gunguList: [
        { name: "Karachi", dongs: ["Clifton", "DHA Karachi", "PECHS", "Gulshan-e-Iqbal", "Saddar", "Korangi"] },
        { name: "Hyderabad", dongs: ["Saddar"] },
      ],
    },
    {
      name: "Khyber Pakhtunkhwa",
      shortName: "KPK",
      gunguList: [
        { name: "Peshawar", dongs: ["University Town", "Hayatabad", "Cantt"] },
        { name: "Abbottabad", dongs: ["Cantt"] },
      ],
    },
    {
      name: "Balochistan",
      shortName: "Balochistan",
      gunguList: [
        { name: "Quetta", dongs: ["Cantonment", "Jinnah Road"] },
        { name: "Gwadar", dongs: ["Port Area"] },
      ],
    },
    {
      name: "Azad Jammu and Kashmir",
      shortName: "AJK",
      gunguList: [
        { name: "Muzaffarabad", dongs: ["City Centre"] },
        { name: "Mirpur", dongs: ["Sector F"] },
      ],
    },
    {
      name: "Gilgit-Baltistan",
      shortName: "Gilgit-Baltistan",
      gunguList: [
        { name: "Gilgit", dongs: ["City Centre"] },
        { name: "Skardu", dongs: ["City Centre"] },
      ],
    },
  ],
  BD: [
    {
      name: "Dhaka Division",
      shortName: "Dhaka",
      gunguList: [
        { name: "Dhaka North", dongs: ["Gulshan", "Banani", "Uttara", "Baridhara"] },
        { name: "Dhaka South", dongs: ["Dhanmondi", "Motijheel", "Old Dhaka (Puran Dhaka)"] },
        { name: "Gazipur", dongs: ["Tongi"] },
      ],
    },
    {
      name: "Chattogram Division (Chittagong)",
      shortName: "Chittagong",
      gunguList: [
        { name: "Chattogram City", dongs: ["Agrabad", "GEC Circle", "Khulshi", "Nasirabad"] },
        { name: "Cox's Bazar", dongs: ["Kolatoli"] },
      ],
    },
    {
      name: "Sylhet Division",
      shortName: "Sylhet",
      gunguList: [
        { name: "Sylhet City", dongs: ["Zindabazar", "Ambarkhana", "Upashahar"] },
      ],
    },
    {
      name: "Rajshahi Division",
      shortName: "Rajshahi",
      gunguList: [
        { name: "Rajshahi City", dongs: ["Shaheb Bazar", "Motihar"] },
      ],
    },
    {
      name: "Khulna Division",
      shortName: "Khulna",
      gunguList: [
        { name: "Khulna City", dongs: ["Shibbari", "Boyra"] },
      ],
    },
    {
      name: "Barishal Division",
      shortName: "Barishal",
      gunguList: [
        { name: "Barishal City", dongs: ["Sadar Road"] },
      ],
    },
    {
      name: "Rangpur Division",
      shortName: "Rangpur",
      gunguList: [
        { name: "Rangpur City", dongs: ["Jahaj Company Mor"] },
      ],
    },
    {
      name: "Mymensingh Division",
      shortName: "Mymensingh",
      gunguList: [
        { name: "Mymensingh City", dongs: ["Ganginar Par"] },
      ],
    },
  ],
  NP: [
    {
      name: "Bagmati Province",
      shortName: "Bagmati",
      gunguList: [
        { name: "Kathmandu District", dongs: ["Thamel", "Baluwatar", "Baneshwor", "Durbar Marg", "Lazimpat"] },
        { name: "Lalitpur District (Patan)", dongs: ["Jhamsikhel", "Kupondole", "Patan Durbar Square"] },
        { name: "Bhaktapur District", dongs: ["Durbar Square"] },
      ],
    },
    {
      name: "Gandaki Province",
      shortName: "Gandaki",
      gunguList: [
        { name: "Kaski (Pokhara)", dongs: ["Lakeside", "Damside", "Mahendrapool"] },
      ],
    },
    {
      name: "Koshi Province",
      shortName: "Koshi",
      gunguList: [
        { name: "Morang (Biratnagar)", dongs: ["Main Road"] },
        { name: "Sunsari (Dharan)", dongs: ["Bhanu Chowk"] },
      ],
    },
    {
      name: "Madhesh Province",
      shortName: "Madhesh",
      gunguList: [
        { name: "Parsa (Birgunj)", dongs: ["Adarshnagar"] },
        { name: "Dhanusha (Janakpur)", dongs: ["Station Road"] },
      ],
    },
    {
      name: "Lumbini Province",
      shortName: "Lumbini",
      gunguList: [
        { name: "Rupandehi (Butwal / Bhairahawa)", dongs: ["Traffic Chowk"] },
        { name: "Kapilvastu (Lumbini)", dongs: ["Lumbini Sacred Garden"] },
      ],
    },
    {
      name: "Karnali Province",
      shortName: "Karnali",
      gunguList: [
        { name: "Surkhet (Birendranagar)", dongs: ["Birendrachowk"] },
      ],
    },
    {
      name: "Sudurpashchim Province",
      shortName: "Sudurpashchim",
      gunguList: [
        { name: "Kailali (Dhangadhi)", dongs: ["Main Road"] },
        { name: "Kanchanpur (Mahendranagar)", dongs: ["Bazaar"] },
      ],
    },
  ],
  LK: [
    {
      name: "Western Province",
      shortName: "Western",
      gunguList: [
        { name: "Colombo", dongs: ["Fort (Colombo 1)", "Kollupitiya (Colombo 3)", "Bambalapitiya (Colombo 4)", "Cinnamon Gardens (Colombo 7)"] },
        { name: "Gampaha", dongs: ["Negombo", "Kelaniya"] },
        { name: "Kalutara", dongs: ["Panadura"] },
      ],
    },
    {
      name: "Central Province",
      shortName: "Central",
      gunguList: [
        { name: "Kandy", dongs: ["Kandy City", "Peradeniya"] },
        { name: "Nuwara Eliya", dongs: ["Town Centre"] },
      ],
    },
    {
      name: "Southern Province",
      shortName: "Southern",
      gunguList: [
        { name: "Galle", dongs: ["Galle Fort", "Unawatuna"] },
        { name: "Matara", dongs: ["Town Centre"] },
        { name: "Hambantota", dongs: ["Port Area"] },
      ],
    },
    {
      name: "Northern Province",
      shortName: "Northern",
      gunguList: [
        { name: "Jaffna", dongs: ["Jaffna Town", "Nallur"] },
      ],
    },
    {
      name: "Eastern Province",
      shortName: "Eastern",
      gunguList: [
        { name: "Trincomalee", dongs: ["Town Centre"] },
        { name: "Batticaloa", dongs: ["Town Centre"] },
      ],
    },
    {
      name: "North Western Province",
      shortName: "North Western",
      gunguList: [
        { name: "Kurunegala", dongs: ["Town Centre"] },
        { name: "Puttalam", dongs: ["Town Centre"] },
      ],
    },
    {
      name: "North Central Province",
      shortName: "North Central",
      gunguList: [
        { name: "Anuradhapura", dongs: ["Sacred City", "New Town"] },
      ],
    },
    {
      name: "Uva Province",
      shortName: "Uva",
      gunguList: [
        { name: "Badulla", dongs: ["Town Centre"] },
        { name: "Ella", dongs: ["Ella Town"] },
      ],
    },
    {
      name: "Sabaragamuwa Province",
      shortName: "Sabaragamuwa",
      gunguList: [
        { name: "Ratnapura", dongs: ["Town Centre"] },
        { name: "Kegalle", dongs: ["Town Centre"] },
      ],
    },
  ],
  MM: [
    {
      name: "Yangon Region",
      shortName: "Yangon",
      gunguList: [
        { name: "Yangon", dongs: ["Dagon", "Kamayut", "Bahan", "Kyauktada", "Mayangone", "Hlaing"] },
      ],
    },
    {
      name: "Mandalay Region",
      shortName: "Mandalay",
      gunguList: [
        { name: "Mandalay City", dongs: ["Chanayethazan", "Mahaaungmye", "Aungmyethazan"] },
        { name: "Pyin Oo Lwin", dongs: ["Central"] },
      ],
    },
    {
      name: "Naypyidaw Union Territory",
      shortName: "Naypyidaw",
      gunguList: [
        { name: "Naypyidaw", dongs: ["Zabuthiri", "Ottarathiri", "Dekkhinathiri"] },
      ],
    },
    {
      name: "Shan State",
      shortName: "Shan",
      gunguList: [
        { name: "Taunggyi", dongs: ["City Centre"] },
        { name: "Inle Lake", dongs: ["Nyaungshwe"] },
        { name: "Lashio", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Bago Region",
      shortName: "Bago",
      gunguList: [
        { name: "Bago City", dongs: ["Central"] },
      ],
    },
    {
      name: "Ayeyarwady Region",
      shortName: "Ayeyarwady",
      gunguList: [
        { name: "Pathein", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Sagaing Region",
      shortName: "Sagaing",
      gunguList: [
        { name: "Monywa", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Mon State",
      shortName: "Mon",
      gunguList: [
        { name: "Mawlamyine", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Kachin State",
      shortName: "Kachin",
      gunguList: [
        { name: "Myitkyina", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Rakhine State",
      shortName: "Rakhine",
      gunguList: [
        { name: "Sittwe", dongs: ["City Centre"] },
        { name: "Thandwe (Ngapali)", dongs: ["Ngapali Beach"] },
      ],
    },
    {
      name: "Kayin State",
      shortName: "Kayin",
      gunguList: [
        { name: "Hpa-an", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Magway Region",
      shortName: "Magway",
      gunguList: [
        { name: "Magway City", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Tanintharyi Region",
      shortName: "Tanintharyi",
      gunguList: [
        { name: "Dawei", dongs: ["City Centre"] },
        { name: "Myeik", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Kayah State",
      shortName: "Kayah",
      gunguList: [
        { name: "Loikaw", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Chin State",
      shortName: "Chin",
      gunguList: [
        { name: "Hakha", dongs: ["City Centre"] },
      ],
    },
  ],
  KH: [
    {
      name: "Phnom Penh",
      shortName: "Phnom Penh",
      gunguList: [
        { name: "Doun Penh", dongs: ["Phsar Kandal", "Boeung Reang", "Chey Chumneah", "Srah Chak"] },
        { name: "Chamkar Mon", dongs: ["Tonle Bassac", "Boeng Keng Kang 1"] },
        { name: "Toul Kork", dongs: ["Boeung Kak", "Phsar Depo"] },
      ],
    },
    {
      name: "Siem Reap",
      shortName: "Siem Reap",
      gunguList: [
        { name: "Siem Reap Municipality", dongs: ["Old Market (Pub Street)", "Wat Bo", "Sala Kamreuk", "Svay Dangkum"] },
      ],
    },
    {
      name: "Preah Sihanouk (Sihanoukville)",
      shortName: "Sihanoukville",
      gunguList: [
        { name: "Sihanoukville City", dongs: ["Ochheuteal Beach", "Otres", "Mittakpheap"] },
      ],
    },
    {
      name: "Battambang",
      shortName: "Battambang",
      gunguList: [
        { name: "Battambang Municipality", dongs: ["Svay Pao", "Rottanak"] },
      ],
    },
    {
      name: "Kandal",
      shortName: "Kandal",
      gunguList: [
        { name: "Ta Khmau", dongs: ["Ta Khmau", "Prek Ruessei"] },
      ],
    },
    {
      name: "Kampot",
      shortName: "Kampot",
      gunguList: [
        { name: "Kampot Municipality", dongs: ["Kampong Bay", "Traeuy Kaoh"] },
      ],
    },
    {
      name: "Banteay Meanchey (Poipet)",
      shortName: "Poipet",
      gunguList: [
        { name: "Poipet City", dongs: ["Poipet"] },
        { name: "Serei Saophoan", dongs: ["Preah Ponlea"] },
      ],
    },
    {
      name: "Kampong Cham",
      shortName: "Kampong Cham",
      gunguList: [
        { name: "Kampong Cham City", dongs: ["Kampong Cham"] },
      ],
    },
    {
      name: "Koh Kong",
      shortName: "Koh Kong",
      gunguList: [
        { name: "Khemarak Phoumin", dongs: ["Smach Mean Chey"] },
      ],
    },
    {
      name: "Kep",
      shortName: "Kep",
      gunguList: [
        { name: "Kep Municipality", dongs: ["Prey Thum", "Crab Market Area"] },
      ],
    },
    {
      name: "Svay Rieng (Bavet)",
      shortName: "Bavet",
      gunguList: [
        { name: "Bavet City", dongs: ["Bavet"] },
        { name: "Svay Rieng City", dongs: ["Svay Rieng"] },
      ],
    },
    {
      name: "Kampong Speu",
      shortName: "Kampong Speu",
      gunguList: [
        { name: "Chbar Mon", dongs: ["Chbar Mon"] },
      ],
    },
    {
      name: "Pursat",
      shortName: "Pursat",
      gunguList: [
        { name: "Pursat Municipality", dongs: ["Roleap"] },
      ],
    },
    {
      name: "Kampong Thom",
      shortName: "Kampong Thom",
      gunguList: [
        { name: "Stung Saen", dongs: ["Kampong Thom"] },
      ],
    },
    {
      name: "Takeo",
      shortName: "Takeo",
      gunguList: [
        { name: "Doun Kaev", dongs: ["Roka Knong"] },
      ],
    },
  ],
  MN: [
    {
      name: "Улаанбаатар (Ulaanbaatar)",
      shortName: "Ulaanbaatar",
      gunguList: [
        { name: "Сүхбаатар дүүрэг (Sükhbaatar)", dongs: ["1-р хороо (Талбай)", "2-р хороо", "Бага тойруу"] },
        { name: "Баянзүрх дүүрэг (Bayanzürkh)", dongs: ["1-р хороо", "Зүүн 4 зам"] },
        { name: "Хан-Уул дүүрэг (Khan-Uul)", dongs: ["120 мянгат", "Зайсан"] },
        { name: "Чингэлтэй дүүрэг (Chingeltei)", dongs: ["Төв шуудан"] },
      ],
    },
    {
      name: "Дархан-Уул (Darkhan)",
      shortName: "Darkhan",
      gunguList: [
        { name: "Дархан сум", dongs: ["Шинэ Дархан", "Хуучин Дархан"] },
      ],
    },
    {
      name: "Орхон (Erdenet)",
      shortName: "Erdenet",
      gunguList: [
        { name: "Баян-Өндөр сум", dongs: ["Эрдэнэт хот"] },
      ],
    },
    {
      name: "Сэлэнгэ (Selenge)",
      shortName: "Selenge",
      gunguList: [
        { name: "Сүхбаатар сум", dongs: ["Төв"] },
        { name: "Алтанбулаг сум", dongs: ["Хилийн боомт"] },
      ],
    },
    {
      name: "Төв (Töv)",
      shortName: "Töv",
      gunguList: [
        { name: "Зуунмод сум", dongs: ["Төв"] },
      ],
    },
    {
      name: "Өмнөговь (South Gobi)",
      shortName: "Ömnögovi",
      gunguList: [
        { name: "Даланзадгад сум", dongs: ["Төв"] },
        { name: "Цогтцэций сум", dongs: ["Тавантолгой"] },
        { name: "Ханбогд сум", dongs: ["Оюутолгой"] },
      ],
    },
    {
      name: "Дорноговь (East Gobi)",
      shortName: "Dornogovi",
      gunguList: [
        { name: "Сайншанд сум", dongs: ["Төв"] },
        { name: "Замын-Үүд сум", dongs: ["Хилийн боомт"] },
      ],
    },
    {
      name: "Хөвсгөл (Khövsgöl)",
      shortName: "Khövsgöl",
      gunguList: [
        { name: "Мөрөн сум", dongs: ["Төв"] },
        { name: "Хатгал сум", dongs: ["Хөвсгөл нуур"] },
      ],
    },
    {
      name: "Ховд (Khovd)",
      shortName: "Khovd",
      gunguList: [
        { name: "Жаргалант сум", dongs: ["Ховд хот"] },
      ],
    },
    {
      name: "Булган (Bulgan)",
      shortName: "Bulgan",
      gunguList: [
        { name: "Булган сум", dongs: ["Төв"] },
      ],
    },
    {
      name: "Дорнод (Dornod)",
      shortName: "Dornod",
      gunguList: [
        { name: "Хэрлэн сум (Чойбалсан)", dongs: ["Төв"] },
      ],
    },
    {
      name: "Архангай (Arkhangai)",
      shortName: "Arkhangai",
      gunguList: [
        { name: "Эрдэнэбулган сум (Цэцэрлэг)", dongs: ["Төв"] },
      ],
    },
    {
      name: "Баян-Өлгий (Bayan-Ölgii)",
      shortName: "Bayan-Ölgii",
      gunguList: [
        { name: "Өлгий сум", dongs: ["Төв"] },
      ],
    },
    {
      name: "Баянхонгор (Bayankhongor)",
      shortName: "Bayankhongor",
      gunguList: [
        { name: "Баянхонгор сум", dongs: ["Төв"] },
      ],
    },
    {
      name: "Өвөрхангай (Övörkhangai)",
      shortName: "Övörkhangai",
      gunguList: [
        { name: "Арвайхээр сум", dongs: ["Төв"] },
        { name: "Хархорин сум", dongs: ["Эрдэнэ зуу"] },
      ],
    },
    {
      name: "Хэнтий (Khentii)",
      shortName: "Khentii",
      gunguList: [
        { name: "Хэрлэн сум (Өндөрхаан)", dongs: ["Төв"] },
      ],
    },
  ],
  TL: [
    {
      name: "Dili",
      shortName: "Dili",
      gunguList: [
        { name: "Vera Cruz", dongs: ["Colmera", "Caicoli", "Motael"] },
        { name: "Nain Feto", dongs: ["Bidau Santana", "Gricenfor"] },
        { name: "Cristo Rei", dongs: ["Becora", "Kuluhun"] },
        { name: "Dom Aleixo", dongs: ["Comoro", "Bebonuk"] },
      ],
    },
    {
      name: "Baucau",
      shortName: "Baucau",
      gunguList: [
        { name: "Baucau Vila", dongs: ["Kota Lama", "Buruma"] },
      ],
    },
    {
      name: "Ermera",
      shortName: "Ermera",
      gunguList: [
        { name: "Gleno", dongs: ["Gleno Central"] },
        { name: "Ermera Vila", dongs: ["Mertuto"] },
      ],
    },
    {
      name: "Bobonaro",
      shortName: "Bobonaro",
      gunguList: [
        { name: "Maliana", dongs: ["Maliana Central"] },
        { name: "Batugade", dongs: ["Border Area"] },
      ],
    },
    {
      name: "Cova Lima",
      shortName: "Cova Lima",
      gunguList: [
        { name: "Suai", dongs: ["Suai Loro", "Debos"] },
      ],
    },
    {
      name: "Lautém",
      shortName: "Lautém",
      gunguList: [
        { name: "Lospalos", dongs: ["Fuiloro", "Home"] },
      ],
    },
    {
      name: "Liquiçá",
      shortName: "Liquiçá",
      gunguList: [
        { name: "Liquiçá Vila", dongs: ["Dato", "Hatuquessi"] },
        { name: "Bazartete", dongs: ["Tibar"] },
      ],
    },
    {
      name: "Manatuto",
      shortName: "Manatuto",
      gunguList: [
        { name: "Manatuto Vila", dongs: ["Ailili", "Ma'abat"] },
      ],
    },
    {
      name: "Manufahi",
      shortName: "Manufahi",
      gunguList: [
        { name: "Same", dongs: ["Babulo", "Holarua"] },
      ],
    },
    {
      name: "Ainaro",
      shortName: "Ainaro",
      gunguList: [
        { name: "Ainaro Vila", dongs: ["Soro"] },
        { name: "Maubisse", dongs: ["Maubisse Central"] },
      ],
    },
    {
      name: "Aileu",
      shortName: "Aileu",
      gunguList: [
        { name: "Aileu Vila", dongs: ["Seloi Craic"] },
      ],
    },
    {
      name: "Viqueque",
      shortName: "Viqueque",
      gunguList: [
        { name: "Viqueque Vila", dongs: ["Caraubalo"] },
      ],
    },
    {
      name: "Oecusse (RAEOA)",
      shortName: "Oecusse",
      gunguList: [
        { name: "Pante Macassar", dongs: ["Costa", "Taiboco"] },
      ],
    },
    {
      name: "Ataúro",
      shortName: "Ataúro",
      gunguList: [
        { name: "Beloi", dongs: ["Vila Maumeta", "Bikeli"] },
      ],
    },
  ],
  MY: [
    {
      name: "Wilayah Persekutuan Kuala Lumpur",
      shortName: "Kuala Lumpur",
      gunguList: [
        { name: "Kuala Lumpur City", dongs: ["Bukit Bintang", "KLCC", "Mont Kiara", "Bangsar", "Brickfields (Little India)", "Cheras", "Kepong"] },
      ],
    },
    {
      name: "Selangor",
      shortName: "Selangor",
      gunguList: [
        { name: "Petaling Jaya", dongs: ["Damansara", "Sunway", "Bandar Utama", "SS2"] },
        { name: "Subang Jaya", dongs: ["SS15", "USJ"] },
        { name: "Shah Alam", dongs: ["Section 7", "Kota Kemuning"] },
        { name: "Klang", dongs: ["Bandar Bukit Tinggi"] },
      ],
    },
    {
      name: "Pulau Pinang (Penang)",
      shortName: "Penang",
      gunguList: [
        { name: "Timur Laut (George Town)", dongs: ["Georgetown Heritage", "Gurney Drive", "Tanjung Tokong", "Batu Ferringhi"] },
        { name: "Barat Daya", dongs: ["Bayan Lepas", "Bayan Baru"] },
      ],
    },
    {
      name: "Johor",
      shortName: "Johor",
      gunguList: [
        { name: "Johor Bahru", dongs: ["JB Sentral", "Tebrau", "Mount Austin", "Permas Jaya"] },
        { name: "Iskandar Puteri", dongs: ["Medini", "Puteri Harbour"] },
      ],
    },
    {
      name: "Sabah",
      shortName: "Sabah",
      gunguList: [
        { name: "Kota Kinabalu", dongs: ["KK City Centre", "Tanjung Aru", "Likas", "Luyang"] },
        { name: "Sandakan", dongs: ["Bandar Indah"] },
      ],
    },
    {
      name: "Sarawak",
      shortName: "Sarawak",
      gunguList: [
        { name: "Kuching", dongs: ["Kuching Waterfront", "Padungan", "Batu Kawa"] },
        { name: "Miri", dongs: ["Marina ParkCity"] },
      ],
    },
    {
      name: "Perak",
      shortName: "Perak",
      gunguList: [
        { name: "Ipoh", dongs: ["Old Town", "New Town", "Canning Garden"] },
        { name: "Taiping", dongs: ["Town Centre"] },
      ],
    },
    {
      name: "Melaka (Malacca)",
      shortName: "Melaka",
      gunguList: [
        { name: "Melaka Tengah", dongs: ["Jonker Street", "Bandar Hilir", "Ayer Keroh"] },
      ],
    },
    {
      name: "Negeri Sembilan",
      shortName: "N. Sembilan",
      gunguList: [
        { name: "Seremban", dongs: ["Seremban 2", "Rasah"] },
        { name: "Port Dickson", dongs: ["Teluk Kemang"] },
      ],
    },
    {
      name: "Pahang",
      shortName: "Pahang",
      gunguList: [
        { name: "Kuantan", dongs: ["Teluk Cempedak", "Bandar Kuantan"] },
        { name: "Bentong", dongs: ["Genting Highlands"] },
        { name: "Cameron Highlands", dongs: ["Tanah Rata"] },
      ],
    },
    {
      name: "Kedah",
      shortName: "Kedah",
      gunguList: [
        { name: "Kota Setar (Alor Setar)", dongs: ["Bandar Alor Setar"] },
        { name: "Langkawi", dongs: ["Kuah", "Pantai Cenang"] },
      ],
    },
    {
      name: "Terengganu",
      shortName: "Terengganu",
      gunguList: [
        { name: "Kuala Terengganu", dongs: ["Batu Buruk", "Chinatown (Kampung Cina)"] },
      ],
    },
    {
      name: "Kelantan",
      shortName: "Kelantan",
      gunguList: [
        { name: "Kota Bharu", dongs: ["Bandar Kota Bharu", "Kubang Kerian"] },
      ],
    },
    {
      name: "Perlis",
      shortName: "Perlis",
      gunguList: [
        { name: "Kangar", dongs: ["Pusat Bandar"] },
      ],
    },
    {
      name: "Wilayah Persekutuan Putrajaya",
      shortName: "Putrajaya",
      gunguList: [
        { name: "Putrajaya", dongs: ["Presint 1", "Presint 2", "Presint 3", "Presint 4"] },
      ],
    },
    {
      name: "Wilayah Persekutuan Labuan",
      shortName: "Labuan",
      gunguList: [
        { name: "Victoria (Labuan Town)", dongs: ["Bandar Labuan"] },
      ],
    },
  ],
  SG: [
    {
      name: "Central Region",
      shortName: "Central",
      gunguList: [
        { name: "Central Area (Downtown)", dongs: ["Downtown Core", "Marina Bay", "Tanjong Pagar", "Raffles Place", "Bugis", "Chinatown"] },
        { name: "Orchard / Novena", dongs: ["Orchard", "Somerset", "Novena", "Newton"] },
        { name: "Bukit Merah / Queenstown", dongs: ["Tiong Bahru", "HarbourFront", "Queenstown"] },
        { name: "Kallang", dongs: ["Kallang", "Boon Keng"] },
      ],
    },
    {
      name: "East Region",
      shortName: "East",
      gunguList: [
        { name: "Bedok / Tampines", dongs: ["Tampines Central", "Bedok", "Simei"] },
        { name: "Changi / Pasir Ris", dongs: ["Changi Airport", "Pasir Ris", "Loyang"] },
        { name: "Marine Parade", dongs: ["Katong", "Joo Chiat", "Marine Parade"] },
      ],
    },
    {
      name: "West Region",
      shortName: "West",
      gunguList: [
        { name: "Jurong East / West", dongs: ["Jurong Gateway", "Jurong Point", "Lakeside"] },
        { name: "Clementi / Bukit Timah", dongs: ["Clementi", "Buona Vista", "One-North", "Beauty World"] },
      ],
    },
    {
      name: "North-East Region",
      shortName: "North-East",
      gunguList: [
        { name: "Serangoon / Hougang", dongs: ["Serangoon Nex", "Hougang", "Kovan"] },
        { name: "Sengkang / Punggol", dongs: ["Sengkang Central", "Punggol Waterway"] },
        { name: "Ang Mo Kio", dongs: ["AMK Central"] },
      ],
    },
    {
      name: "North Region",
      shortName: "North",
      gunguList: [
        { name: "Woodlands", dongs: ["Woodlands Central", "Causeway Point"] },
        { name: "Yishun", dongs: ["Northpoint City", "Chong Pang"] },
        { name: "Sembawang", dongs: ["Sembawang Central"] },
      ],
    },
  ],
  AE: [
    {
      name: "Dubai",
      shortName: "Dubai",
      gunguList: [
        { name: "Downtown / Business Bay", dongs: ["Downtown Dubai", "Burj Khalifa Area", "Business Bay", "DIFC"] },
        { name: "Marina / JBR", dongs: ["Dubai Marina", "JBR", "JLT", "Palm Jumeirah"] },
        { name: "Old Dubai (Deira / Bur Dubai)", dongs: ["Deira", "Al Rigga", "Bur Dubai", "Al Karama"] },
        { name: "Al Barsha", dongs: ["Al Barsha 1", "Mall of the Emirates Area"] },
      ],
    },
    {
      name: "Abu Dhabi",
      shortName: "Abu Dhabi",
      gunguList: [
        { name: "Abu Dhabi Island", dongs: ["Corniche", "Al Danah", "Al Zahiyah (Tourist Club)", "Al Khalidiyah"] },
        { name: "Al Reem Island", dongs: ["Najmat", "Marina Square"] },
        { name: "Yas Island", dongs: ["Yas Marina"] },
        { name: "Al Ain", dongs: ["Al Central"] },
      ],
    },
    {
      name: "Sharjah",
      shortName: "Sharjah",
      gunguList: [
        { name: "Al Majaz", dongs: ["Corniche", "Al Majaz 1-3"] },
        { name: "Al Qasimia", dongs: ["Mahattah"] },
        { name: "Al Nahda", dongs: ["Al Nahda Sharjah"] },
      ],
    },
    {
      name: "Ajman",
      shortName: "Ajman",
      gunguList: [
        { name: "Ajman Downtown", dongs: ["Corniche", "Al Nuaimia", "Al Rashidiya"] },
      ],
    },
    {
      name: "Ras Al Khaimah",
      shortName: "RAK",
      gunguList: [
        { name: "Al Nakheel", dongs: ["Center"] },
        { name: "Al Hamra", dongs: ["Al Hamra Village"] },
      ],
    },
    {
      name: "Fujairah",
      shortName: "Fujairah",
      gunguList: [
        { name: "Fujairah City", dongs: ["Hamad Bin Abdulla Rd", "Corniche"] },
      ],
    },
    {
      name: "Umm Al Quwain",
      shortName: "UAQ",
      gunguList: [
        { name: "UAQ City", dongs: ["Old Town", "Al Salamah"] },
      ],
    },
  ],
  SA: [
    {
      name: "Riyadh Region",
      shortName: "Riyadh",
      gunguList: [
        { name: "Riyadh City", dongs: ["Al Olaya", "Al Malaz", "Al Nakheel", "Al Murabba", "King Abdullah Financial District (KAFD)"] },
        { name: "Al Kharj", dongs: ["Center"] },
      ],
    },
    {
      name: "Makkah Region",
      shortName: "Makkah",
      gunguList: [
        { name: "Jeddah", dongs: ["Al Balad", "Al Hamra", "Al Zahra", "Al Rawdah", "Corniche"] },
        { name: "Makkah (Mecca)", dongs: ["Al Haram Area", "Al Aziziyah"] },
        { name: "Taif", dongs: ["Al Shafa", "Al Hada"] },
      ],
    },
    {
      name: "Eastern Province (Ash Sharqiyah)",
      shortName: "Eastern",
      gunguList: [
        { name: "Dammam", dongs: ["Corniche", "Al Faisaliyah"] },
        { name: "Al Khobar", dongs: ["Corniche", "Al Olaya"] },
        { name: "Dhahran", dongs: ["Aramco / KFUPM"] },
        { name: "Jubail", dongs: ["Industrial City"] },
      ],
    },
    {
      name: "Madinah Region",
      shortName: "Madinah",
      gunguList: [
        { name: "Madinah (Medina)", dongs: ["Al Haram Area", "Quba"] },
      ],
    },
    {
      name: "Al Qassim",
      shortName: "Al Qassim",
      gunguList: [
        { name: "Buraidah", dongs: ["Center"] },
        { name: "Unaizah", dongs: ["Center"] },
      ],
    },
    {
      name: "Asir",
      shortName: "Asir",
      gunguList: [
        { name: "Abha", dongs: ["Center"] },
        { name: "Khamis Mushait", dongs: ["Center"] },
      ],
    },
    {
      name: "Tabuk",
      shortName: "Tabuk",
      gunguList: [
        { name: "Tabuk City", dongs: ["Center"] },
        { name: "NEOM", dongs: ["The Line Area"] },
      ],
    },
    {
      name: "Hail",
      shortName: "Hail",
      gunguList: [
        { name: "Hail City", dongs: ["Center"] },
      ],
    },
    {
      name: "Jazan",
      shortName: "Jazan",
      gunguList: [
        { name: "Jazan City", dongs: ["Corniche"] },
      ],
    },
    {
      name: "Najran",
      shortName: "Najran",
      gunguList: [
        { name: "Najran City", dongs: ["Center"] },
      ],
    },
    {
      name: "Al Baha",
      shortName: "Al Baha",
      gunguList: [
        { name: "Al Baha City", dongs: ["Center"] },
      ],
    },
    {
      name: "Al Jawf",
      shortName: "Al Jawf",
      gunguList: [
        { name: "Sakakah", dongs: ["Center"] },
      ],
    },
    {
      name: "Northern Borders",
      shortName: "Northern Borders",
      gunguList: [
        { name: "Arar", dongs: ["Center"] },
      ],
    },
  ],
  EG: [
    {
      name: "Cairo (Al Qahirah)",
      shortName: "Cairo",
      gunguList: [
        { name: "Downtown Cairo", dongs: ["Tahrir", "Zamalek", "Garden City"] },
        { name: "New Cairo", dongs: ["Fifth Settlement (Tagamoa)", "Rehab City"] },
        { name: "Nasr City", dongs: ["Abbas El Akkad"] },
        { name: "Maadi", dongs: ["Degla", "Corniche Maadi"] },
        { name: "Heliopolis", dongs: ["Korba", "Roxy"] },
      ],
    },
    {
      name: "Giza (Al Jizah)",
      shortName: "Giza",
      gunguList: [
        { name: "Dokki / Mohandessin", dongs: ["Mohandessin", "Dokki"] },
        { name: "Pyramids / Haram", dongs: ["Al Haram", "Faisal"] },
        { name: "Sheikh Zayed / 6th of October", dongs: ["Sheikh Zayed", "6th of October City"] },
      ],
    },
    {
      name: "Alexandria (Al Iskandariyah)",
      shortName: "Alexandria",
      gunguList: [
        { name: "Alexandria City", dongs: ["Montaza", "Sidi Gaber", "Raml Station", "Gleem", "Smouha"] },
      ],
    },
    {
      name: "Red Sea (Al Bahr al Ahmar)",
      shortName: "Red Sea",
      gunguList: [
        { name: "Hurghada", dongs: ["El Dahar", "Sekalla", "El Gouna"] },
        { name: "Marsa Alam", dongs: ["Port Ghalib"] },
      ],
    },
    {
      name: "South Sinai (Janub Sina)",
      shortName: "South Sinai",
      gunguList: [
        { name: "Sharm El Sheikh", dongs: ["Naama Bay", "Nabq Bay", "Ras Um Sid"] },
        { name: "Dahab", dongs: ["Lighthouse"] },
      ],
    },
    {
      name: "Dakahlia",
      shortName: "Dakahlia",
      gunguList: [
        { name: "Mansoura", dongs: ["Touril", "El Gomhouria"] },
      ],
    },
    {
      name: "Gharbia",
      shortName: "Gharbia",
      gunguList: [
        { name: "Tanta", dongs: ["El Bahr St"] },
        { name: "El Mahalla El Kubra", dongs: ["Center"] },
      ],
    },
    {
      name: "Sharqia",
      shortName: "Sharqia",
      gunguList: [
        { name: "Zagazig", dongs: ["Center"] },
        { name: "10th of Ramadan", dongs: ["Industrial Area"] },
      ],
    },
    {
      name: "Port Said",
      shortName: "Port Said",
      gunguList: [
        { name: "Port Said City", dongs: ["Port Fouad", "Tarh El Bahr"] },
      ],
    },
    {
      name: "Suez",
      shortName: "Suez",
      gunguList: [
        { name: "Suez City", dongs: ["Port Tawfiq", "Arbaeen"] },
      ],
    },
    {
      name: "Luxor",
      shortName: "Luxor",
      gunguList: [
        { name: "Luxor City", dongs: ["East Bank", "Karnak"] },
      ],
    },
    {
      name: "Aswan",
      shortName: "Aswan",
      gunguList: [
        { name: "Aswan City", dongs: ["Corniche", "Elephantine"] },
      ],
    },
    {
      name: "Qalyubia",
      shortName: "Qalyubia",
      gunguList: [
        { name: "Banha", dongs: ["Center"] },
        { name: "Shubra El Kheima", dongs: ["Center"] },
      ],
    },
    {
      name: "Fayoum",
      shortName: "Fayoum",
      gunguList: [
        { name: "Fayoum City", dongs: ["Center"] },
      ],
    },
    {
      name: "Ismailia",
      shortName: "Ismailia",
      gunguList: [
        { name: "Ismailia City", dongs: ["Center"] },
      ],
    },
  ],
  IQ: [
    {
      name: "Baghdad Governorate",
      shortName: "Baghdad",
      gunguList: [
        { name: "Al-Karkh", dongs: ["Mansour", "Al-Yarmouk", "Kadhimiya", "Green Zone"] },
        { name: "Al-Rusafa", dongs: ["Karrada", "Jadiriya", "Zayouna", "Al-Sa'adoon"] },
      ],
    },
    {
      name: "Erbil Governorate (KRI)",
      shortName: "Erbil",
      gunguList: [
        { name: "Erbil City", dongs: ["Citadel Area", "Dream City", "Gulan Street", "Ankawa", "Empire World"] },
      ],
    },
    {
      name: "Basra Governorate",
      shortName: "Basra",
      gunguList: [
        { name: "Basra City", dongs: ["Al-Ashar", "Al-Bradhiah", "Corniche Al-Basra", "Manawi Basha"] },
      ],
    },
    {
      name: "Sulaymaniyah Governorate (KRI)",
      shortName: "Sulaymaniyah",
      gunguList: [
        { name: "Sulaymaniyah City", dongs: ["Salim Street", "Sarchinar", "Bakrajo"] },
      ],
    },
    {
      name: "Duhok Governorate (KRI)",
      shortName: "Duhok",
      gunguList: [
        { name: "Duhok City", dongs: ["Shakhke", "Nohadra"] },
      ],
    },
    {
      name: "Nineveh Governorate (Mosul)",
      shortName: "Mosul",
      gunguList: [
        { name: "Mosul City", dongs: ["Left Bank (Al-Zuhur)", "Right Bank (Old City)"] },
      ],
    },
    {
      name: "Najaf Governorate",
      shortName: "Najaf",
      gunguList: [
        { name: "Najaf City", dongs: ["Old City", "Kufa"] },
      ],
    },
    {
      name: "Karbala Governorate",
      shortName: "Karbala",
      gunguList: [
        { name: "Karbala City", dongs: ["Old City", "Al-Abbas Area"] },
      ],
    },
    {
      name: "Kirkuk Governorate",
      shortName: "Kirkuk",
      gunguList: [
        { name: "Kirkuk City", dongs: ["Rahimawa", "Qoriya"] },
      ],
    },
    {
      name: "Al Anbar Governorate",
      shortName: "Anbar",
      gunguList: [
        { name: "Ramadi", dongs: ["Center"] },
        { name: "Fallujah", dongs: ["Center"] },
      ],
    },
    {
      name: "Babylon Governorate (Babil)",
      shortName: "Babil",
      gunguList: [
        { name: "Hillah", dongs: ["Babylon Ruins Area"] },
      ],
    },
    {
      name: "Diyala Governorate",
      shortName: "Diyala",
      gunguList: [
        { name: "Baqubah", dongs: ["Center"] },
      ],
    },
  ],
  IR: [
    {
      name: "Tehran",
      shortName: "Tehran",
      gunguList: [
        { name: "District 1-3 (North)", dongs: ["Tajrish", "Zaferaniyeh", "Elahiyeh", "Niavaran", "Jordan"] },
        { name: "District 6 (Central)", dongs: ["Valiasr", "Karimkhan", "Fatemi"] },
        { name: "District 2 (West)", dongs: ["Sa'adat Abad", "Shahrak-e Gharb"] },
      ],
    },
    {
      name: "Isfahan",
      shortName: "Isfahan",
      gunguList: [
        { name: "Isfahan City", dongs: ["Naqsh-e Jahan", "Jolfa", "Chaharbagh", "Zayandeh Rood Area"] },
      ],
    },
    {
      name: "Fars (Shiraz)",
      shortName: "Shiraz",
      gunguList: [
        { name: "Shiraz City", dongs: ["Eram", "Zand", "Qasr Dasht", "Hafez Area"] },
      ],
    },
    {
      name: "Razavi Khorasan (Mashhad)",
      shortName: "Mashhad",
      gunguList: [
        { name: "Mashhad City", dongs: ["Haram Area", "Ahmadabad", "Sajjad", "Kuhsangi"] },
      ],
    },
    {
      name: "East Azerbaijan (Tabriz)",
      shortName: "Tabriz",
      gunguList: [
        { name: "Tabriz City", dongs: ["Valiasr", "Abresan", "Bazaar Area"] },
      ],
    },
    {
      name: "Alborz (Karaj)",
      shortName: "Karaj",
      gunguList: [
        { name: "Karaj City", dongs: ["Gohardasht", "Mehrshahr", "Azimieh"] },
      ],
    },
    {
      name: "Khuzestan",
      shortName: "Khuzestan",
      gunguList: [
        { name: "Ahvaz", dongs: ["Kianpars", "Zeitun Karmandi"] },
      ],
    },
    {
      name: "Gilan (Rasht)",
      shortName: "Rasht",
      gunguList: [
        { name: "Rasht City", dongs: ["Golsar", "Shahrdari"] },
      ],
    },
    {
      name: "Mazandaran",
      shortName: "Mazandaran",
      gunguList: [
        { name: "Sari", dongs: ["Center"] },
        { name: "Babolsar", dongs: ["Coast"] },
      ],
    },
    {
      name: "Qom",
      shortName: "Qom",
      gunguList: [
        { name: "Qom City", dongs: ["Haram Area", "Salarieh"] },
      ],
    },
    {
      name: "Hormozgan (Bandar Abbas / Kish)",
      shortName: "Hormozgan",
      gunguList: [
        { name: "Kish Island", dongs: ["Marjan", "Saadi"] },
        { name: "Bandar Abbas", dongs: ["Coast"] },
      ],
    },
    {
      name: "Yazd",
      shortName: "Yazd",
      gunguList: [
        { name: "Yazd City", dongs: ["Old Town", "Safayeh"] },
      ],
    },
    {
      name: "Kermanshah",
      shortName: "Kermanshah",
      gunguList: [
        { name: "Kermanshah City", dongs: ["Nobahar", "Ferdowsi"] },
      ],
    },
  ],
  YE: [
    {
      name: "Sana'a Governorate (Capital)",
      shortName: "Sana'a",
      gunguList: [
        { name: "Sana'a City", dongs: ["Old City", "Al Tahrir", "Hadda", "Al Sabeen", "Zubairy St"] },
      ],
    },
    {
      name: "Aden",
      shortName: "Aden",
      gunguList: [
        { name: "Aden City", dongs: ["Crater", "Al Mualla", "Khor Maksar", "Al Mansoura", "Tawahi"] },
      ],
    },
    {
      name: "Taiz",
      shortName: "Taiz",
      gunguList: [
        { name: "Taiz City", dongs: ["Al Qahirah", "Salh", "Al Mudhaffar"] },
      ],
    },
    {
      name: "Al Hudaydah",
      shortName: "Hudaydah",
      gunguList: [
        { name: "Al Hudaydah City", dongs: ["Al Mina", "Al Hawak"] },
      ],
    },
    {
      name: "Hadhramaut",
      shortName: "Hadhramaut",
      gunguList: [
        { name: "Mukalla", dongs: ["Al Mukalla Old Town"] },
        { name: "Say'un", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Ibb",
      shortName: "Ibb",
      gunguList: [
        { name: "Ibb City", dongs: ["Al Mashannah", "Al Dhihar"] },
      ],
    },
    {
      name: "Dhamar",
      shortName: "Dhamar",
      gunguList: [
        { name: "Dhamar City", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Marib",
      shortName: "Marib",
      gunguList: [
        { name: "Marib City", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Socotra",
      shortName: "Socotra",
      gunguList: [
        { name: "Hadibu", dongs: ["City Centre"] },
      ],
    },
  ],
  IL: [
    {
      name: "Tel Aviv District",
      shortName: "Tel Aviv",
      gunguList: [
        { name: "Tel Aviv-Yafo", dongs: ["Lev HaIr (Center)", "Rothschild", "Florentin", "Old Jaffa", "Ramat Aviv", "Neve Tzedek"] },
        { name: "Ramat Gan", dongs: ["Diamond Exchange"] },
        { name: "Herzliya", dongs: ["Herzliya Pituach"] },
      ],
    },
    {
      name: "Jerusalem District",
      shortName: "Jerusalem",
      gunguList: [
        { name: "Jerusalem City", dongs: ["Old City", "Rehavia", "Talbiya", "German Colony", "Downtown (Jaffa St)", "Talpiot"] },
      ],
    },
    {
      name: "Central District",
      shortName: "Central",
      gunguList: [
        { name: "Petah Tikva", dongs: ["Kiryat Arye", "Em HaMoshavot"] },
        { name: "Netanya", dongs: ["City Center", "Poleg"] },
        { name: "Rishon LeZion", dongs: ["West Rishon"] },
        { name: "Rehovot", dongs: ["Weizmann Area"] },
      ],
    },
    {
      name: "Haifa District",
      shortName: "Haifa",
      gunguList: [
        { name: "Haifa City", dongs: ["Carmel Center", "German Colony", "Downtown (Hadar)", "Bat Galim"] },
      ],
    },
    {
      name: "Southern District",
      shortName: "Southern",
      gunguList: [
        { name: "Be'er Sheva", dongs: ["Old City", "Ramot"] },
        { name: "Ashdod", dongs: ["City Center", "Marina"] },
        { name: "Eilat", dongs: ["North Beach"] },
      ],
    },
    {
      name: "Northern District",
      shortName: "Northern",
      gunguList: [
        { name: "Nazareth", dongs: ["Old City"] },
        { name: "Tiberias", dongs: ["Sea of Galilee Coast"] },
        { name: "Acre (Akko)", dongs: ["Old City"] },
      ],
    },
    {
      name: "Judea and Samaria Area",
      shortName: "Judea & Samaria",
      gunguList: [
        { name: "Ariel", dongs: ["City Center"] },
        { name: "Ma'ale Adumim", dongs: ["Center"] },
      ],
    },
  ],
  ET: [
    {
      name: "Addis Ababa",
      shortName: "Addis Ababa",
      gunguList: [
        { name: "Bole", dongs: ["Bole Medhanealem", "Bole Atlas", "Olympia"] },
        { name: "Kirkos", dongs: ["Meskel Square", "Kazanchis"] },
        { name: "Yeka", dongs: ["Megenagna", "CMC"] },
        { name: "Arada", dongs: ["Piazza", "4 Kilo"] },
        { name: "Lideta", dongs: ["Balcha"] },
      ],
    },
    {
      name: "Oromia",
      shortName: "Oromia",
      gunguList: [
        { name: "Adama (Nazret)", dongs: ["City Centre"] },
        { name: "Bishoftu (Debre Zeyit)", dongs: ["Lakeside"] },
        { name: "Jimma", dongs: ["City Centre"] },
        { name: "Shashamane", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Amhara",
      shortName: "Amhara",
      gunguList: [
        { name: "Bahir Dar", dongs: ["Lake Tana Area"] },
        { name: "Gondar", dongs: ["Fasil Ghebbi Area"] },
        { name: "Dessie", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Sidama",
      shortName: "Sidama",
      gunguList: [
        { name: "Hawassa", dongs: ["Lake Hawassa Shore", "Piazza"] },
      ],
    },
    {
      name: "Dire Dawa",
      shortName: "Dire Dawa",
      gunguList: [
        { name: "Dire Dawa City", dongs: ["Kezira", "Megala"] },
      ],
    },
    {
      name: "Tigray",
      shortName: "Tigray",
      gunguList: [
        { name: "Mekelle", dongs: ["Kedamay Weyane", "Ayder"] },
      ],
    },
    {
      name: "Somali Region",
      shortName: "Somali",
      gunguList: [
        { name: "Jijiga", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Harari",
      shortName: "Harari",
      gunguList: [
        { name: "Harar", dongs: ["Harar Jugol (Old Walled City)"] },
      ],
    },
    {
      name: "Afar Region",
      shortName: "Afar",
      gunguList: [
        { name: "Semera", dongs: ["City Centre"] },
      ],
    },
    {
      name: "Southern Nations (South Ethiopia)",
      shortName: "South",
      gunguList: [
        { name: "Arba Minch", dongs: ["Sikela", "Shecha"] },
        { name: "Wolaita Sodo", dongs: ["City Centre"] },
      ],
    },
  ],
  ZA: [
    {
      name: "Gauteng",
      shortName: "Gauteng",
      gunguList: [
        { name: "Johannesburg", dongs: ["Sandton", "Rosebank", "Johannesburg CBD", "Randburg", "Fourways", "Soweto"] },
        { name: "Pretoria (Tshwane)", dongs: ["Hatfield", "Brooklyn", "Menlyn", "Centurion"] },
      ],
    },
    {
      name: "Western Cape",
      shortName: "Western Cape",
      gunguList: [
        { name: "Cape Town", dongs: ["City Bowl (CBD)", "Camps Bay", "Sea Point", "V&A Waterfront", "Green Point", "Claremont", "Stellenbosch"] },
      ],
    },
    {
      name: "KwaZulu-Natal",
      shortName: "KZN",
      gunguList: [
        { name: "Durban (eThekwini)", dongs: ["Umhlanga", "Durban North", "Morningside", "Durban CBD", "Ballito"] },
      ],
    },
    {
      name: "Eastern Cape",
      shortName: "Eastern Cape",
      gunguList: [
        { name: "Gqeberha (Port Elizabeth)", dongs: ["Summerstrand", "Walmer"] },
        { name: "East London", dongs: ["Nahoon"] },
      ],
    },
    {
      name: "Free State",
      shortName: "Free State",
      gunguList: [
        { name: "Bloemfontein", dongs: ["Westdene", "Brandwag"] },
      ],
    },
    {
      name: "Limpopo",
      shortName: "Limpopo",
      gunguList: [
        { name: "Polokwane", dongs: ["Bendor", "CBD"] },
      ],
    },
    {
      name: "Mpumalanga",
      shortName: "Mpumalanga",
      gunguList: [
        { name: "Mbombela (Nelspruit)", dongs: ["Riverside", "CBD"] },
        { name: "Emalahleni (Witbank)", dongs: ["CBD"] },
      ],
    },
    {
      name: "North West",
      shortName: "North West",
      gunguList: [
        { name: "Rustenburg", dongs: ["CBD"] },
        { name: "Potchefstroom", dongs: ["Bult"] },
      ],
    },
    {
      name: "Northern Cape",
      shortName: "Northern Cape",
      gunguList: [
        { name: "Kimberley", dongs: ["CBD"] },
        { name: "Upington", dongs: ["CBD"] },
      ],
    },
  ],
  NG: [
    {
      name: "Lagos State",
      shortName: "Lagos",
      gunguList: [
        { name: "Lagos Island / Eti-Osa", dongs: ["Victoria Island (VI)", "Ikoyi", "Lekki Phase 1", "Chevron / Ajah"] },
        { name: "Lagos Mainland", dongs: ["Ikeja (GRA)", "Surulere", "Yaba", "Maryland", "Gbagada"] },
      ],
    },
    {
      name: "Federal Capital Territory",
      shortName: "Abuja",
      gunguList: [
        { name: "Abuja Municipal (AMAC)", dongs: ["Maitama", "Asokoro", "Wuse 2", "Garki", "Central Business District (CBD)", "Jabi", "Gwarinpa"] },
      ],
    },
    {
      name: "Rivers State",
      shortName: "Rivers",
      gunguList: [
        { name: "Port Harcourt", dongs: ["Old GRA", "New GRA", "Peter Odili Rd", "Trans Amadi"] },
      ],
    },
    {
      name: "Oyo State",
      shortName: "Oyo",
      gunguList: [
        { name: "Ibadan", dongs: ["Bodija", "Jericho", "Agodi GRA", "Ring Road"] },
      ],
    },
    {
      name: "Kano State",
      shortName: "Kano",
      gunguList: [
        { name: "Kano Municipal", dongs: ["Nassarawa GRA", "Sabon Gari"] },
      ],
    },
    {
      name: "Kaduna State",
      shortName: "Kaduna",
      gunguList: [
        { name: "Kaduna City", dongs: ["Barnawa", "Malali", "Unga Rimi"] },
      ],
    },
    {
      name: "Edo State",
      shortName: "Edo",
      gunguList: [
        { name: "Benin City", dongs: ["GRA", "Uselu"] },
      ],
    },
    {
      name: "Delta State",
      shortName: "Delta",
      gunguList: [
        { name: "Warri", dongs: ["GRA"] },
        { name: "Asaba", dongs: ["GRA"] },
      ],
    },
    {
      name: "Anambra State",
      shortName: "Anambra",
      gunguList: [
        { name: "Awka", dongs: ["GRA"] },
        { name: "Onitsha", dongs: ["GRA"] },
      ],
    },
    {
      name: "Enugu State",
      shortName: "Enugu",
      gunguList: [
        { name: "Enugu City", dongs: ["Independence Layout", "New Haven"] },
      ],
    },
    {
      name: "Ogun State",
      shortName: "Ogun",
      gunguList: [
        { name: "Abeokuta", dongs: ["Ibikunle"] },
        { name: "Ota", dongs: ["Industrial Area"] },
      ],
    },
    {
      name: "Akwa Ibom State",
      shortName: "Akwa Ibom",
      gunguList: [
        { name: "Uyo", dongs: ["Ewet Housing Estate", "Shelter Afrique"] },
      ],
    },
    {
      name: "Plateau State",
      shortName: "Plateau",
      gunguList: [
        { name: "Jos", dongs: ["Rayfield", "Jos South"] },
      ],
    },
  ],
  BR: [
    {
      name: "São Paulo",
      shortName: "SP",
      gunguList: [
        { name: "São Paulo Capital", dongs: ["Jardins", "Pinheiros", "Itaim Bibi", "Vila Madalena", "Moema", "Bela Vista (Paulista)", "Bom Retiro (Koreatown)"] },
        { name: "Campinas", dongs: ["Cambuí"] },
        { name: "Santos", dongs: ["Gonzaga"] },
      ],
    },
    {
      name: "Rio de Janeiro",
      shortName: "RJ",
      gunguList: [
        { name: "Rio de Janeiro Capital", dongs: ["Copacabana", "Ipanema", "Leblon", "Barra da Tijuca", "Botafogo", "Flamengo", "Centro"] },
        { name: "Niterói", dongs: ["Icaraí"] },
      ],
    },
    {
      name: "Distrito Federal",
      shortName: "DF",
      gunguList: [
        { name: "Brasília", dongs: ["Asa Sul", "Asa Norte", "Lago Sul", "Sudoeste"] },
      ],
    },
    {
      name: "Minas Gerais",
      shortName: "MG",
      gunguList: [
        { name: "Belo Horizonte", dongs: ["Savassi", "Lourdes", "Funcionários", "Buritis"] },
      ],
    },
    {
      name: "Bahia",
      shortName: "BA",
      gunguList: [
        { name: "Salvador", dongs: ["Barra", "Pituba", "Pelourinho", "Rio Vermelho"] },
      ],
    },
    {
      name: "Paraná",
      shortName: "PR",
      gunguList: [
        { name: "Curitiba", dongs: ["Batel", "Bigorrilho", "Centro", "Água Verde"] },
      ],
    },
    {
      name: "Rio Grande do Sul",
      shortName: "RS",
      gunguList: [
        { name: "Porto Alegre", dongs: ["Moinhos de Vento", "Bela Vista", "Petrópolis"] },
      ],
    },
    {
      name: "Ceará",
      shortName: "CE",
      gunguList: [
        { name: "Fortaleza", dongs: ["Meireles", "Aldeota", "Praia de Iracema"] },
      ],
    },
    {
      name: "Pernambuco",
      shortName: "PE",
      gunguList: [
        { name: "Recife", dongs: ["Boa Viagem", "Graças", "Recife Antigo"] },
      ],
    },
    {
      name: "Santa Catarina",
      shortName: "SC",
      gunguList: [
        { name: "Florianópolis", dongs: ["Centro", "Jurerê Internacional", "Lagoa da Conceição"] },
      ],
    },
    {
      name: "Goiás",
      shortName: "GO",
      gunguList: [
        { name: "Goiânia", dongs: ["Setor Bueno", "Setor Marista"] },
      ],
    },
    {
      name: "Amazonas",
      shortName: "AM",
      gunguList: [
        { name: "Manaus", dongs: ["Ponta Negra", "Adrianópolis"] },
      ],
    },
    {
      name: "Espírito Santo",
      shortName: "ES",
      gunguList: [
        { name: "Vitória", dongs: ["Praia do Canto"] },
      ],
    },
    {
      name: "Mato Grosso",
      shortName: "MT",
      gunguList: [
        { name: "Cuiabá", dongs: ["Goiabeiras"] },
      ],
    },
    {
      name: "Mato Grosso do Sul",
      shortName: "MS",
      gunguList: [
        { name: "Campo Grande", dongs: ["Chácara Cachoeira"] },
      ],
    },
  ],
  MX: [
    {
      name: "Ciudad de México (CDMX)",
      shortName: "CDMX",
      gunguList: [
        { name: "Cuauhtémoc", dongs: ["Roma Norte", "Condesa", "Juárez (Zona Rosa/Koreatown)", "Centro Histórico"] },
        { name: "Miguel Hidalgo", dongs: ["Polanco", "Lomas de Chapultepec", "Anzures"] },
        { name: "Benito Juárez", dongs: ["Del Valle", "Narvarte"] },
        { name: "Coyoacán", dongs: ["Coyoacán Centro"] },
        { name: "Álvaro Obregón", dongs: ["Santa Fe", "San Ángel"] },
      ],
    },
    {
      name: "Nuevo León",
      shortName: "NL",
      gunguList: [
        { name: "Monterrey", dongs: ["San Pedro Garza García", "Valle Oriente", "Centro", "Cumbres"] },
      ],
    },
    {
      name: "Jalisco",
      shortName: "Jalisco",
      gunguList: [
        { name: "Guadalajara", dongs: ["Zapopan (Puerta de Hierro)", "Providencia", "Americana", "Chapultepec", "Centro"] },
      ],
    },
    {
      name: "Quintana Roo (Cancún)",
      shortName: "QRoo",
      gunguList: [
        { name: "Cancún (Benito Juárez)", dongs: ["Zona Hotelera", "Centro"] },
        { name: "Playa del Carmen (Solidaridad)", dongs: ["Quinta Avenida", "Playacar"] },
        { name: "Tulum", dongs: ["La Veleta", "Aldea Zama"] },
      ],
    },
    {
      name: "Estado de México",
      shortName: "Edomex",
      gunguList: [
        { name: "Naucalpan", dongs: ["Ciudad Satélite"] },
        { name: "Huixquilucan", dongs: ["Interlomas"] },
        { name: "Toluca", dongs: ["Centro"] },
      ],
    },
    {
      name: "Yucatán",
      shortName: "Yucatán",
      gunguList: [
        { name: "Mérida", dongs: ["Paseo de Montejo", "Centro Histórico", "Altabrisa"] },
      ],
    },
    {
      name: "Puebla",
      shortName: "Puebla",
      gunguList: [
        { name: "Puebla Capital", dongs: ["Angelópolis", "La Paz", "Centro Histórico"] },
      ],
    },
    {
      name: "Querétaro",
      shortName: "Querétaro",
      gunguList: [
        { name: "Querétaro Capital", dongs: ["Juriquilla", "Centro Histórico", "Álamos"] },
      ],
    },
    {
      name: "Baja California (Tijuana)",
      shortName: "BC",
      gunguList: [
        { name: "Tijuana", dongs: ["Zona Río", "Playas de Tijuana", "Agua Caliente"] },
        { name: "Mexicali", dongs: ["Centro"] },
      ],
    },
    {
      name: "Guanajuato",
      shortName: "Guanajuato",
      gunguList: [
        { name: "León", dongs: ["Campestre"] },
        { name: "San Miguel de Allende", dongs: ["Centro Histórico"] },
        { name: "Guanajuato City", dongs: ["Centro"] },
      ],
    },
    {
      name: "Chihuahua",
      shortName: "Chihuahua",
      gunguList: [
        { name: "Ciudad Juárez", dongs: ["Campos Elíseos"] },
        { name: "Chihuahua City", dongs: ["San Felipe"] },
      ],
    },
    {
      name: "Baja California Sur",
      shortName: "BCS",
      gunguList: [
        { name: "Los Cabos", dongs: ["San José del Cabo", "Cabo San Lucas"] },
        { name: "La Paz", dongs: ["Malecón"] },
      ],
    },
    {
      name: "Veracruz",
      shortName: "Veracruz",
      gunguList: [
        { name: "Veracruz / Boca del Río", dongs: ["Costa de Oro", "Reforma"] },
      ],
    },
    {
      name: "Sonora",
      shortName: "Sonora",
      gunguList: [
        { name: "Hermosillo", dongs: ["Pitiquito", "Centro"] },
      ],
    },
    {
      name: "Sinaloa",
      shortName: "Sinaloa",
      gunguList: [
        { name: "Culiacán", dongs: ["Tres Ríos"] },
        { name: "Mazatlán", dongs: ["Zona Dorada"] },
      ],
    },
  ],
};
