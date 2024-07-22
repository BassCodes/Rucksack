# Development

- [Build System](#build-system)
- [General Description](#general-description)
- [Bundle Size Reduction Techniques](#used-bundle-size-reduction-techniques)
- [Unused techniques][#unused-techniques]

## General Description

The project is written in TypeScript. Typescript modules are compiled and bundled using [Rollup](https://rollupjs.org/). A custom build script (build.mjs) is used to minify CSS and inject it into the compiled bundle. As a final step [Terser](https://terser.org/) is used to reduce bundle size even further.

Many choices in this project have been to reduce the bundle size. In the current year of 2024, it truly doesn't matter (in most cases) if your page is 2MiB or 2KiB, it loads just the same. Consider the practices listed in this document an exercise in creating a small script.

The other goals are as follows

- Graceful degradation when script fails to load (blocked, error, etc.)
- Clean simple interface
- Semantic Markup
- Accessible (need help with this one)

## Build System

The build system found within **build.mjs** is in essence a UNIX makefile. I would have written it in a makefile, but Node is already required to compile, so it only makes sense to stick with the ecosystem. Portability is an added plus of writing it in JavaScript too.

This project does not use Webpack as its module bundling left a lot of unnecessary data in the final bundle. When I previously looked at it, I did not find a way to make this better.

The build system has three stages:

1. Compile Typescript and bundle modules
2. Minify CSS and inject into bundle
3. Minify bundle

After each stage is completed, a resulting file is outputted to the build directory.

The build system accepts the following commands

```shell
# Build stage 1, stage 2, and stage 3
npm run build
# Build stage 1, and stage 2
npm run build-dev
# Clean build directory
npm run clean
```

I have yet to look into other systems like Vite.

## Used Bundle Size Reduction Techniques

A main goal of this project is to make a very small script. The following not-industry-standard techniques have been used to achieve this goal. In the spirit of keeping the code somewhat readable, some extra-codegolfy methods have not been used.

### `let` instead of `const`

const is 5 bytes and let is three. Immutable references would be nice, using let shaves off a few bytes.

### Alias All the Globals

If a global variable, like `document` is used more than once, a global variable alias for it, `DOCUMENT` is made. The symbol is almost as readable as the original, except with the added benefit of being reducible to a single character by the minifier.

Global aliases are found in `util.ts`

### Arrow functions instead of proper functions

Unless specifically needed, `function doThing(param)` is not used in favor of its shorter equivalent `let doThing=(param)=>`. This doesn't change readability very much so is an easy gain of a few bytes.

### Use `el.onclick` instead of `el.addEventListener("click", ...)`

Event listeners are to be avoided when not needed.

### Use `el.append` instead of `el.appendChild`
the `append` method is shorter than `appendChild` and also allows for appending multiple children at the same time.

### Avoid TypeScript Enums
Enums include runtime code for formatting to strings which is not needed for this project.

### Create icons as SVG in code
The method used is a bit freaky. There's no need to duplicate the comments in `icons.ts` so check them out.

## Unused Techniques


### Alias this
Theres one final optimization which I wanted to use, but thought otherwise to it.
The `this` keyword used inside of class methods and constructors takes up four bytes,
but can easily be aliased to a single character. I chose not to do this as it felt very wrong,
and would likely confuse people.


### No classes?

To be true,  I haven't explored this idea. It is possible that using classes wastes space. Perhaps free functions and objects would be more space efficient; I don't know. 