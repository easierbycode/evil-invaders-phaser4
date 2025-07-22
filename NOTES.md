
















is the atlas being completely overridden? (should I even load the first one?)







































> 
overrides can be applied to playerData or an enemy in enemyData (PROPERTIES.resource.recipe.data.playerData or PROPERTIES.resource.recipe.data.enemyData)

overrides fetch an atlas (JSON + PNG) and character (JSON) from Firebase

PROBLEM: atlas frames are out of sync with character frames (texture[])

should character textureKey match atlas key?
i.e. character/dukeNukem textureKey duke fetches atlases/duke

create a process and UI which allows user to select a character, then the 
enemy or playerData to be replaced
ensure character texture[] frames all exist in atlas.
if not, create a new atlas by letting user select from ref(db, "sprites"). after creating atlas let
user select a subset of it's frames for the character texture[], which is used for the character's "default" animation


























new LoadScene with only what's needed, and loading anim