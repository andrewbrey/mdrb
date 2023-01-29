Output ./demos/demo.gif

Require deno
Require mdrb

Set Theme "Gruvbox Dark"
Set Shell bash
Set FontFamily "JetBrainsMono Nerd Font"

# pre-cache runtime deps
Hide
Type "mdrb https://deno.land/x/mdrb/demo.md --mode isolated"
Enter
Sleep 5s
Type "clear"
Enter
Sleep 500ms
Show

Type "mdrb https://deno.land/x/mdrb/demo.md --mode isolated"
Enter
Sleep 5s
