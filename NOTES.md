
















is the atlas being completely overridden? (should I even load the first one?)







































> 
overrides can be applied to playerData or an enemy in enemyData

overrides fetch an atlas (JSON + PNG) and character (JSON)

PROBLEM: atlas frames are out of sync with character frames (texture[])

should character textureKey match atlas key?
i.e. character/dukeNukem textureKey duke fetches atlases/duke

create a process and UI which allows user to select a character, then the 
enemy or playerData to be replaced
ensure character texture[] frames all exist in atlas.
if not, create a new atlas by letting user select from ref(db, "sprites"). also let
user select a subset of those sprites for the character texture[], which are used for
it's "default" animation


























new LoadScene with only what's needed, and loading anim