const parse = require('markdown-to-ast').parse,
      removeMd = require('remove-markdown');
      slug = require('slug');
function splitContent(str){
      var bytesCount = 0;
      var res = new Array();
      for (var i = 0, p = 0; i < str.length; i++) {
            var c = str.charAt(i);
            if (/^[\u0000-\u00ff]$/.test(c)) {
                  bytesCount += 1;
            }
            else {
                  bytesCount += 2;
            }
            if (bytesCount > 5000 || i == (str.length - 1)){
                  res.push(str.slice(p, i) + "\n");
                  p = i;
                  bytesCount = 0;
            }
      }
      return res;
}
const parserFactory = () => {
  return {

    // Returns true if any fragments have been successfully parsed
    parse: (post, index) => {
      let fragment = {},
          headingCount = 0, fragLength = 0;

      const markdown = JSON.parse(post.attributes.mobiledoc).cards[0][1].markdown,
            astChildren = parse(markdown).children;

      if(astChildren.length !== 0) {
        // Set first hypothetical headless fragment attributes.
        if(astChildren[0].type !== 'Header') {
          fragment.id = post.attributes.slug;
          fragment.url = post.attributes.slug;
          fragment.importance = 0; // we give a higher importance to the intro
          // aka the first headless fragment.
          fragment.post_uuid = post.attributes.uuid;
          fragment.post_title = post.attributes.title;
          fragment.post_published_at = post.attributes.published_at;
        }

        astChildren.forEach(function(element){
          if(element.type === 'Header') {
            // Send previous fragment
            if (fragment.content != undefined){
                  var splited = splitContent(fragment.content)
                  for (var i in splited) {
                        fragment.content = splited[i];
                        headingCount ++;
                        fragment.id = post.attributes.slug + '#slice-' + headingCount;
                        fragment.objectID = post.attributes.slug + '#slice-' + headingCount;
                        index.addFragment(JSON.parse(JSON.stringify(fragment)));
                  }
            }
            fragment = {};
            headingCount ++;
            fragment.heading = element.children[0].value;
            fragment.url = post.attributes.slug + '#' + slug(fragment.heading);
            fragment.importance = element.depth;
            fragment.post_uuid = post.attributes.uuid;
            fragment.post_title = post.attributes.title;
            fragment.post_published_at = post.attributes.published_at;
          } else {
            if(fragment.content === undefined) fragment.content = '';
            fragment.content += removeMd(element.raw) + '\n';
          }
        });

        // Saving the last fragment (as saving only happens as a new heading
        // is found). This also takes care of heading-less articles.
        if (fragment.content != undefined){
            var splited = splitContent(fragment.content)
            for (var i in splited) {
                  fragment.content = splited[i];
                  headingCount ++;
                  fragment.id = post.attributes.slug + '#slice-' + headingCount;
                  fragment.objectID = post.attributes.slug + '#slice-' + headingCount;
                  index.addFragment(JSON.parse(JSON.stringify(fragment)));
            }
        }
      }

      return index.fragmentsCount();
    }
  }
}

module.exports = parserFactory;
