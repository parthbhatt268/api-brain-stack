'use strict';

/**
 * One-shot seed script — inserts 19 nodes and generates their embeddings.
 *
 * Usage:
 *   1. Set SEED_USER_ID in your .env to your Supabase user UUID
 *   2. Run:  node scripts/seed.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { generateEmbedding } = require('../src/services/embedding');
const { randomUUID } = require('crypto');

const USER_ID = process.env.SEED_USER_ID;
if (!USER_ID) {
  console.error('ERROR: Set SEED_USER_ID in your .env file (your Supabase user UUID).');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─────────────────────────────────────────────────────────────────────────────
// 19 nodes — AI (7) · Guitar (6) · Gardening (6)
// Sources: youtube, article, github, linkedin, tiktok, instagram, reddit
// ─────────────────────────────────────────────────────────────────────────────

const NODES = [

  // ── AI · LLMs (3) ────────────────────────────────────────────────────────────

  {
    category: 'ai', subcategory: 'large language models', source: 'youtube',
    url: 'https://www.youtube.com/watch?v=zjkBMFhNj_g',
    summary: `Andrej Karpathy's landmark one-hour talk introducing large language models to a general technical audience. Karpathy frames LLMs not as simple chatbots but as a new kind of operating system — capable of orchestrating tools, memory, and external APIs. He covers how GPT-4-class models are trained on internet-scale text, the role of RLHF in shaping behaviour, and how inference works at the token level. He also discusses the emerging concept of the "LLM OS", where the model acts as a reasoning core that dispatches tasks to specialised modules. A foundational watch for anyone building on top of modern AI.`,
  },
  {
    category: 'ai', subcategory: 'large language models', source: 'youtube',
    url: 'https://www.youtube.com/watch?v=wjZofJX0v4M',
    summary: `3Blue1Brown's visual introduction to GPT and the Transformer architecture. Using Grant Sanderson's signature animation style, the video walks through how attention mechanisms allow a model to weigh relationships between every token in a sequence simultaneously. It explains the query-key-value formulation, multi-head attention, and positional encodings without requiring deep mathematical prerequisites. The video demystifies why Transformers replaced recurrent networks for language tasks and gives viewers a strong visual intuition for what the model is doing when it generates text one token at a time.`,
  },
  {
    category: 'ai', subcategory: 'large language models', source: 'article',
    url: 'https://jalammar.github.io/illustrated-transformer/',
    summary: `Jay Alammar's "The Illustrated Transformer" is one of the most widely cited tutorials on the Transformer architecture, referenced in university courses at MIT, Stanford, and Cornell. Published in 2018, it uses step-by-step diagrams to walk through every component: the encoder-decoder structure, self-attention, multi-head attention, and feed-forward layers. It bridges the gap between the original "Attention is All You Need" paper and practical implementation. The visual approach makes abstract matrix operations tangible and is essential reading before diving into any LLM fine-tuning or architecture work.`,
  },

  // ── AI · Agents (2) ──────────────────────────────────────────────────────────

  {
    category: 'ai', subcategory: 'ai agents', source: 'youtube',
    url: 'https://www.youtube.com/watch?v=sal78ACtGTc',
    summary: `Andrew Ng's talk at Sequoia Capital's AI Ascent 2024 event, focused on the next wave of AI: agentic workflows. Ng argues that the biggest performance gains won't come from larger models but from multi-step agentic loops — where an AI plans, executes, reflects, and revises its work, similar to how a human iterates on a draft. He introduces four key design patterns: reflection, tool use, planning, and multi-agent collaboration. He also discusses which tasks suit agents today versus those still requiring human oversight — a strategic overview for anyone building production AI applications.`,
  },
  {
    category: 'ai', subcategory: 'ai agents', source: 'article',
    url: 'https://lilianweng.github.io/posts/2023-06-23-agent/',
    summary: `Lilian Weng's June 2023 blog post is the definitive technical reference for LLM-powered autonomous agents. It systematically covers the three building blocks: planning (task decomposition, chain-of-thought, reflection), memory (in-context, external vector stores, knowledge graphs), and tool use (APIs, code execution, web search). Weng surveys landmark agent frameworks including ReAct, Reflexion, and AutoGPT, and discusses challenges around reliability, long-horizon planning, and context length limits. Written by an OpenAI researcher, this post has been cited thousands of times and remains the go-to primer for anyone designing or evaluating agent architectures.`,
  },

  // ── AI · Tools & Community (2) ───────────────────────────────────────────────

  {
    category: 'ai', subcategory: 'ai tools', source: 'github',
    url: 'https://github.com/huggingface/transformers',
    summary: `The Hugging Face Transformers library is the most widely used open-source toolkit for working with large language models, with over 130,000 GitHub stars. It provides a unified API for downloading, fine-tuning, and running thousands of pre-trained models — including BERT, GPT-2, T5, LLaMA, Mistral, and Falcon — across NLP, vision, and audio tasks. The library supports PyTorch, TensorFlow, and JAX backends. Its model hub hosts hundreds of thousands of community-contributed checkpoints. Transformers is the de facto standard starting point for any team doing applied AI research, fine-tuning, or model evaluation in production.`,
  },
  {
    category: 'ai', subcategory: 'ai community', source: 'reddit',
    url: 'https://www.reddit.com/r/LocalLLaMA/',
    summary: `r/LocalLLaMA is the most active Reddit community for running large language models locally on consumer hardware. With hundreds of thousands of members, the subreddit covers quantised model releases (GGUF, GPTQ, AWQ formats), hardware benchmarks for GPUs and Apple Silicon, comparisons of inference engines like llama.cpp, Ollama, and LM Studio, and practical guides for running models like Llama 3, Mistral, Phi-3, and Gemma on personal machines. It is the fastest-moving source of community knowledge on open-weight models, local inference performance, and practical prompt engineering outside of corporate AI labs.`,
  },

  // ── Guitar · Technique (3) ───────────────────────────────────────────────────

  {
    category: 'guitar', subcategory: 'guitar technique', source: 'article',
    url: 'https://www.justinguitar.com/guitar-lessons/beginner-day-1-guitar-quick-start-aw-007',
    summary: `JustinGuitar's Day 1 beginner lesson, the starting point of the world's most popular free guitar course. Justin Sandercoe covers the absolute basics: how to hold the guitar correctly, how to position the fretting hand to avoid muting strings, how to strum with a pick or fingers, and how to press down on frets cleanly. This lesson also introduces the D chord — typically the first chord beginners learn — and gives a practice routine for the first day. JustinGuitar is used by millions worldwide and praised by professional guitarists including David Gilmour for its structured, jargon-free teaching style.`,
  },
  {
    category: 'guitar', subcategory: 'guitar technique', source: 'youtube',
    url: 'https://www.youtube.com/@PaulDavids',
    summary: `Paul Davids is a Dutch guitarist and educator with 3.6 million YouTube subscribers, known for his exceptionally clear teaching style and deep musicality. His channel covers beginner technique, advanced phrasing, tone chasing, and gear breakdowns. His most popular videos include "10 Things Beginner Guitarists Should Know" and a series on playing guitar with feeling rather than just technical accuracy. Paul bridges the gap between technique and musical expression better than almost any other guitar educator online, making his channel essential for players at any level who want to go beyond mechanical practice.`,
  },
  {
    category: 'guitar', subcategory: 'guitar technique', source: 'tiktok',
    url: 'https://www.tiktok.com/@justinguitarofficial',
    summary: `JustinGuitar's official TikTok account brings guitar education to short-form video, with bite-sized lessons on chords, strumming patterns, and technique tips designed for the scroll-friendly format. Videos cover beginner chord transitions, quick theory concepts, and practice challenges that players can do in minutes. The account translates Justin Sandercoe's structured teaching philosophy into 30–60 second clips, making it easy to pick up a small skill or reinforce a concept between practice sessions. An ideal complement to the full JustinGuitar course for learners who prefer visual, quick-hit content.`,
  },

  // ── Guitar · Music Theory (3) ────────────────────────────────────────────────

  {
    category: 'guitar', subcategory: 'music theory for guitar', source: 'youtube',
    url: 'https://www.youtube.com/watch?v=3Ym7X_wCsPQ',
    summary: `Rick Beato's "What Makes This Song Great?" episode on Queen's Bohemian Rhapsody, one of the most popular episodes in his landmark music analysis series. Beato breaks down the harmonic structure of the song's shifting sections — ballad, operatic, hard rock — explaining how Freddie Mercury used unconventional chord progressions and key changes that shouldn't work on paper but are emotionally perfect. Brian May's guitar work, the multi-tracked vocal harmonies, and the production techniques are all analysed in detail. This episode demonstrates applied music theory in the context of a culturally iconic recording.`,
  },
  {
    category: 'guitar', subcategory: 'music theory for guitar', source: 'article',
    url: 'https://www.musictheoryacademy.com/understanding-music/the-circle-of-fifths/',
    summary: `A comprehensive free guide to the Circle of Fifths — the most important visual tool in Western music theory. The article explains what the circle is, how the 12 major keys and their relative minors are arranged around it, and why adjacent keys share almost all the same notes, making modulation between them sound smooth. For guitarists, the Circle of Fifths explains why certain chord progressions feel resolved, how to write songs that stay in key, and how to predict which chords will work together. Includes diagrams and practical examples applied directly to the guitar fretboard.`,
  },
  {
    category: 'guitar', subcategory: 'music theory for guitar', source: 'reddit',
    url: 'https://www.reddit.com/r/guitar/',
    summary: `r/guitar is one of the largest guitar communities on the internet, with millions of members spanning total beginners to professional session players. The subreddit features gear advice, technique discussions, progress videos, tone comparisons, and song recommendations. Weekly threads cover what people are learning, gear they have acquired, and questions about theory and technique. It is an invaluable resource for getting crowdsourced opinions on equipment, understanding what practice approaches work for self-taught guitarists, and staying connected to a global community of players across all genres and skill levels.`,
  },

  // ── Gardening · Vegetable Gardening (2) ──────────────────────────────────────

  {
    category: 'gardening', subcategory: 'vegetable gardening', source: 'youtube',
    url: 'https://www.youtube.com/@CharlesDowding',
    summary: `Charles Dowding is the leading authority on no-dig gardening — a method of growing vegetables without tilling the soil, instead layering compost on top. His YouTube channel documents decades of practical experiments at his Homeacres farm in Somerset, England, comparing dig versus no-dig beds side by side. His videos consistently show higher yields and healthier soil in no-dig plots. Dowding covers salads, brassicas, roots, and alliums, with detailed attention to timing, spacing, and compost quality. His calm, evidence-based teaching style has built a global following among gardeners wanting to grow more food with less labour.`,
  },
  {
    category: 'gardening', subcategory: 'vegetable gardening', source: 'instagram',
    url: 'https://www.instagram.com/epicgardening/',
    summary: `Epic Gardening's Instagram account is run by Kevin Espiritu and his team, offering daily gardening inspiration, practical growing tips, and behind-the-scenes content from their test gardens. Posts cover container gardening for small spaces, urban food production, plant care advice, and seasonal what-to-grow guides. The account's visual format makes it ideal for quickly absorbing gardening techniques — from how to set up a drip irrigation system to identifying common pests. With millions of followers, the Epic Gardening Instagram is one of the most active and informative gardening accounts for both beginner and experienced food growers.`,
  },

  // ── Gardening · Indoor Plants (1) ────────────────────────────────────────────

  {
    category: 'gardening', subcategory: 'indoor plants', source: 'youtube',
    url: 'https://www.youtube.com/@Planterina',
    summary: `Planterina is one of the most popular houseplant YouTube channels, run by Amanda Switzer with 868,000 subscribers and over 131 million views. The channel focuses on practical plant care for common and rare houseplants — Monsteras, Pothos, Snake Plants, Fiddle Leaf Figs, and succulents. Videos cover watering schedules, light requirements, repotting, propagation, and diagnosing problems like root rot, yellowing leaves, and pests. Planterina's warm and accessible teaching style makes it an excellent resource for anyone building an indoor plant collection or trying to revive struggling houseplants.`,
  },

  // ── Gardening · Composting & Soil (1) ────────────────────────────────────────

  {
    category: 'gardening', subcategory: 'composting and soil', source: 'article',
    url: 'https://ed.ted.com/lessons/vermicomposting-how-worms-can-reduce-our-waste-matthew-ross',
    summary: `A TED-Ed animated lesson explaining vermicomposting — using worms to convert kitchen scraps and organic waste into nutrient-rich compost. The lesson covers the biology of red wigglers, how they break down organic matter faster than traditional composting, what to feed them and what to avoid, and how to set up a worm bin at home. It also explains the broader environmental impact: food waste is one of the largest contributors to landfill methane emissions, and vermicomposting offers a practical household solution. Clear, visual, and science-grounded — an ideal introduction to worm composting.`,
  },

  // ── Gardening · Garden Community (1) ─────────────────────────────────────────

  {
    category: 'gardening', subcategory: 'garden community', source: 'reddit',
    url: 'https://www.reddit.com/r/gardening/',
    summary: `r/gardening is one of the largest gardening communities online, with millions of members sharing advice, progress photos, pest identification help, and seasonal growing tips. The subreddit covers all gardening styles — vegetable gardens, flower beds, container gardening, and large-scale homesteads — across a wide range of climates. Weekly threads include harvests, what members are planting, and questions for experienced growers. It is an invaluable resource for getting quick identification help for plant diseases and pests, discovering what grows well in different regions, and staying motivated through a community that celebrates both successes and failures in the garden.`,
  },

  // ── Gardening · Garden Design (1) ────────────────────────────────────────────

  {
    category: 'gardening', subcategory: 'garden design and layout', source: 'youtube',
    url: 'https://www.youtube.com/@GardenAnswer',
    summary: `Garden Answer is run by Laura LeBoutillier and her husband Aaron, documenting the creation and evolution of their large property garden in Oregon. With 2 million subscribers and 581 million total views, the channel is known for beautiful garden design, real-time planting walkthroughs, seasonal overviews, and honest reviews of plants that thrive or fail in their climate. Laura's content spans perennial bed design, container gardening, front yard curb appeal, and large-scale landscape planning. The channel's production quality and genuine "this is what actually works" approach make it one of the most inspiring and practical garden design channels on YouTube.`,
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// Seed
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`Seeding ${NODES.length} nodes for user ${USER_ID}\n`);

  let inserted = 0;
  let failed   = 0;

  for (const [i, node] of NODES.entries()) {
    const label = `[${i + 1}/${NODES.length}] ${node.source.padEnd(9)} ${node.subcategory} — ${node.url.slice(0, 55)}`;
    process.stdout.write(`${label} ... `);

    try {
      const embedding = await generateEmbedding(node.summary);

      const { error } = await supabase.from('nodes').insert({
        id:          randomUUID(),
        user_id:     USER_ID,
        category:    node.category,
        subcategory: node.subcategory,
        source:      node.source,
        url:         node.url,
        summary:     node.summary,
        origin:      'added',
        embedding,
      });

      if (error) throw new Error(error.message);

      console.log('OK');
      inserted++;
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Failed: ${failed}`);
}

seed().catch(err => {
  console.error('Seed script crashed:', err.message);
  process.exit(1);
});
