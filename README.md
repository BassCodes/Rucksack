# Rucksack

A lightweight web widget to replace the standard `<audio>`. Gracefully degrades when used without JavaScript. The script is less than **8KiB** and should be plug-and-play.

Features

- Less than 8KiB size (6,549B with room to grow)
- Self contained. No extra stylesheets needed
- Works with or without JavaScript
- Keyboard Media keys support
- Mostly standards conforming HTML
- Dark mode support

##  Usage

The script is installed by inserting the following in the document head

```HTML
<head>
<!-- ... -->
<script src="rucksack.min.js"></script>
<!-- ... -->
</head>
```

Single audio tracks can be described by wrapping the audio in a figure, and giving it a title through a figure caption. The audio tag must have the `controls` attribute, and the figure tag must have the custom `data-rsc` attribute.

```HTML
<figure data-rsc>
    <figcaption>Song 1</figcaption>
    <audio controls src="song.mp3"></audio>
</figure>
```

A multi-track audio player is created by creating an ordered list of audio tracks with titles before them. To be seen by the script, the list must have the custom attribute `data-rsc`, and for any individual track to be added to the player, it must have the `controls` attribute.

```HTML
<ol data-rsc>
    <li>
        Title 1
        <audio controls src="song1.mp3"></audio>
    </li>
    <li>
        Title 2
        <audio controls src="song2.mp3"></audio>
    </li>
</ol>
```


## Inspiration

The fundamental principle behind this project is [Progressive Enhancement](https://indieweb.org/progressive_enhancement). The player should be usable for people even if they are using the browser without javascript, or with a slow internet connection. 

The primary inspiration for this project is the [Scritch Player](https://github.com/torcado194/scritch-player
), a music player meant to be easily embeddable within [itch.io](https://itch.io) pages.

The player design was inspired a bit by Scritch, but in decent part came from the design of the Bandcamp player ([example](https://c418.bandcamp.com/album/one)).

## Development 

This project is fairly bespoke in how it has been developed. These practices are detailed in [development.md](./DEVELOPMENT.md)