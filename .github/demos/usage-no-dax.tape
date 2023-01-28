Output .github/demos/usage-no-dax.gif

Require deno
Require mdrb

Set Theme "Gruvbox Dark"
Set Shell bash
Set FontFamily "JetBrainsMono Nerd Font"

# pre-cache runtime deps
Hide
Type "mdrb .github/demos/usage-no-dax.md --mode isolated"
Enter
Sleep 5s
Type "clear"
Enter
Sleep 500ms
Show

Type "batcat .github/demos/usage-no-dax.md"
Enter
Sleep 2s

Type "mdrb .github/demos/usage-no-dax.md"
Enter
Sleep 2s

Type "mdrb .github/demos/usage-no-dax.md --dax=false"
Enter
Sleep 3s
