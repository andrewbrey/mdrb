Output ./demos/demo.gif

Require deno
Require mdrb

Set Theme "GruvboxDark"
Set Shell bash
Set FontFamily "JetBrainsMono Nerd Font"

# pre-cache runtime deps
Hide
Type "mdrb ./demos/demo.md --mode isolated"
Enter
Sleep 5s
Type "clear"
Enter
Sleep 500ms
Show

Type "batcat ./demos/demo.md"
Enter
Sleep 2s

Type "mdrb ./demos/demo.md"
Enter

Sleep 1s
Type "y"
Sleep 500ms
Enter
Sleep 2s

Type "mdrb ./demos/demo.md --dax=false"
Enter
Sleep 1s
Type "y"
Sleep 500ms
Enter

Sleep 2s
