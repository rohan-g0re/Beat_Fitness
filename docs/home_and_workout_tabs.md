# HOME TAB and flows:

### View 1

1. first half should be the activiity calendar as given in Frame: "Activity on Equinox+ (iOS)" --> in 3rd screen as: "Calendar, Progress"
    - This calendar should show the current streak and the longest streak of the user 
    - It shuold show the activiity tick marks on days 

2. Below it should be 1 card of today's workout --> this card should look like the cards given in Frame: "Class Detail on Equinox+ (iOS)" in the first screen named: "Home, Progress"


### View 2 --> When User clicks on the "Today's Workout" Card

1. first half of screen should be like SECOND screen in Frame: "Class Detail on Equinox+ (iOS)" , screen named as "Class & Lesson Detail"
    - This should have an image (as given) and title of the muscle selected (Eg: Back, Biceps)

2. The remaining is a list of cards as given in Frame: "More on Equinox+ (iOS)" in Screen 2: 
    - These cards will be the exercise decied for that day



# Workout Tab and flows:

### View 1

1. The heading of the page should be "Your Routines" which will have cards similar to Frame: "More on Equinox+ (iOS)" in Screen 2

### View 2 --> Clicking on any Routine Takes us to next View of Days

1. Here we can see day cards as given in Frame: "More on Equinox+ (iOS)" in Screen 2 named as monday, tuesday, ..... sunday

### View 3 --> Clicking on any Day takes us to next View of Exercises 

**This is the exact view which we land from the "Today's Workout" card from home** - [Home Tab, View 2.2]

1. We will have a set of exercises for each day card in each routine 



************

# Backend Working


1. After Workout tab --> Select a ROUTINE --> Select a Day --> (see list of exercises) there should be a button as "Add Exercise" which should open up a small popup which shows 2 buttons "Manual" and "AI"

2. Clicking on manual opens a small window in bottom which asks for exercise name, sets, reps per set, weight per each set - this should get added in the list and updated in the backend (refer @all_data_models.sql for model reference)

3. AI mode comming soon
 

************

# Instructions for ALL pages 

1. Scrollable 
2. Follow EXACT FIGMA SCREENS - Everything has a design philosopy that needs to be adhered to!