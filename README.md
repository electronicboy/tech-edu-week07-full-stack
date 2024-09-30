# Full Stack React/Express App

For this project, I used Express to create an API endpoint to offer various endpoint routes accessed from a React front
for client-side rendering. I made a form for creating a post and adding comments to its page. The backend was used to
facilitate operations with the database, including ensuring that we do not expose unpublished posts and supporting
operations such as deleting comments.

I implemented authentication to the app as one of the first things I did as it somewhat annoyed me that in previous
projects, everything was just left open to the breeze, utilzing bcrypt, which is pretty much the standard these days,
was pretty easy, thanks to the library available, the only headache I had here on this front was due to the two
different JWT libraries available in which represented stuff differently, next time I touch JWT, I'm going to need to
compare libraries again due to differences between the server and the client environment has caused complications.

I've also long been a fan of promise chaining, as it's more familiar to my Java background. However, I have noticed that
this has created some minor headaches in terms of how I lay stuff out. I feel that I mostly mitigated this through
changing how I nest promises a bit better, however, and so it's something I am a bit more aware of now.

The prospect of working in TypeScript increasingly becomes more attractive, as type information is something that I
sorely miss from Java, especially when it comes to avenues like passing data around. I almost instinctively utilised the
routes demo; however, I was somewhat concerned about the implications of moving some stuff around, potentially upsetting
intellisense.
