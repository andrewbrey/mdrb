Output .github/demos/usage-remote-pipe.gif

Require deno
Require mdrb

Set Theme "Gruvbox Dark"
Set Shell bash
Set FontFamily "JetBrainsMono Nerd Font"

# pre-cache runtime deps
Hide
Type "curl -sSLf https://deno.land/x/mdrb/demo.md | mdrb"
Enter
Sleep 5s
Type "clear"
Enter
Sleep 500ms
Show

Type "curl -sSLf https://deno.land/x/mdrb/demo.md | mdrb"
Enter
Sleep 4s
