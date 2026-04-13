'use strict';

/**
 * One-shot seed script — inserts 24 nodes and generates their embeddings.
 *
 * Usage:
 *   1. Set SEED_USER_ID in your .env to your Supabase user UUID
 *      (find it in Supabase dashboard → Authentication → Users)
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
  process.env.SUPABASE_SERVICE_ROLE_KEY   // service role key bypasses RLS
);

// ─────────────────────────────────────────────────────────────────────────────
// Node definitions — 24 nodes across AI / Guitar / Gardening
// ─────────────────────────────────────────────────────────────────────────────

const NODES = [

  // ── AI: LLMs ────────────────────────────────────────────────────────────────

  {
    category: 'ai',
    subcategory: 'large language models',
    source: 'youtube',
    url: 'https://www.youtube.com/watch?v=zjkBMFhNj_g',
    summary: `Andrej Karpathy's landmark one-hour talk introducing large language models to a general technical audience. Karpathy explains what LLMs are under the hood — treating them as a new kind of operating system rather than a simple chatbot. He covers how models like GPT-4 are trained on internet-scale text corpora, the role of reinforcement learning from human feedback (RLHF), and how fine-tuning shapes model behaviour. He also discusses the emerging "LLM OS" concept, where the model orchestrates tools, memory, and external APIs. A foundational watch for anyone building on top of modern AI systems.`,
  },
  {
    category: 'ai',
    subcategory: 'large language models',
    source: 'youtube',
    url: 'https://www.youtube.com/watch?v=wjZofJX0v4M',
    summary: `3Blue1Brown's visual introduction to GPT and the Transformer architecture. Using Grant Sanderson's signature animation style, the video walks through how attention mechanisms allow a model to weigh relationships between every token in a sequence simultaneously. It explains the query-key-value formulation, multi-head attention, and positional encodings without requiring deep mathematical prerequisites. The video demystifies why Transformers replaced recurrent networks for language tasks and gives viewers a strong visual intuition for what "the model is doing" when it generates text one token at a time.`,
  },
  {
    category: 'ai',
    subcategory: 'large language models',
    source: 'article',
    url: 'https://jalammar.github.io/illustrated-transformer/',
    summary: `Jay Alammar's "The Illustrated Transformer" is one of the most widely cited tutorials on the Transformer architecture, referenced in university courses at MIT, Stanford, and Cornell. Published in 2018, it uses step-by-step diagrams to walk through every component: the encoder-decoder structure, self-attention, multi-head attention, and feed-forward layers. It bridges the gap between the original "Attention is All You Need" paper and practical implementation. Essential reading before diving into any LLM fine-tuning or architecture work. The visual approach makes abstract matrix operations tangible.`,
  },

  // ── AI: Agents ──────────────────────────────────────────────────────────────

  {
    category: 'ai',
    subcategory: 'ai agents',
    source: 'youtube',
    url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY',
    summary: `Andrej Karpathy builds a GPT-style language model from scratch in Python, explaining every line of code. Starting from raw Shakespeare text and ending with a working character-level transformer that generates coherent prose, this four-hour video is the definitive hands-on introduction to training LLMs. Karpathy covers tokenisation, the self-attention mechanism, positional encodings, training loops, and the scaling laws that underpin modern models. By the end viewers understand not just how to use a language model but how it actually learns — making it invaluable context for anyone building AI-powered agents and tools.`,
  },
  {
    category: 'ai',
    subcategory: 'ai agents',
    source: 'youtube',
    url: 'https://www.youtube.com/watch?v=sal78ACtGTc',
    summary: `Andrew Ng's talk at Sequoia Capital's AI Ascent 2024 event, focused on the next wave of AI: agentic workflows. Ng argues that the biggest performance gains won't come from larger models but from multi-step agentic loops where an AI plans, executes, reflects, and revises its work — similar to how a human iterates on a draft. He introduces four key design patterns: reflection, tool use, planning, and multi-agent collaboration. Ng also discusses which tasks are best suited to agents today versus those still requiring human oversight. A strategic overview for anyone building production AI applications.`,
  },
  {
    category: 'ai',
    subcategory: 'ai agents',
    source: 'article',
    url: 'https://lilianweng.github.io/posts/2023-06-23-agent/',
    summary: `Lilian Weng's June 2023 blog post is the definitive technical reference for LLM-powered autonomous agents. It systematically covers the three building blocks: planning (task decomposition, chain-of-thought, reflection), memory (in-context, external vector stores, knowledge graphs), and tool use (APIs, code execution, web search). Weng surveys landmark agent frameworks including ReAct, Reflexion, and AutoGPT, and discusses challenges around reliability, long-horizon planning, and context length limits. Written by an OpenAI researcher, this post has been cited thousands of times and remains the go-to primer for anyone designing or evaluating agent architectures.`,
  },

  // ── AI: Computer Vision ─────────────────────────────────────────────────────

  {
    category: 'ai',
    subcategory: 'computer vision',
    source: 'youtube',
    url: 'https://www.youtube.com/watch?v=py5byOOHZM8',
    summary: `Computerphile's "Neural Network That Changes Everything" with Dr Mike Pound explains convolutional neural networks and why they revolutionised image recognition. The video covers how CNNs use learned filters to detect edges, textures, and high-level features in images — dramatically outperforming hand-engineered approaches. Pound walks through AlexNet's landmark ImageNet result, explains pooling and feature maps in plain language, and explains why depth matters. A compact, accessible explainer that gives computer vision beginners a solid mental model of how modern image classifiers work before diving into PyTorch or TensorFlow implementations.`,
  },
  {
    category: 'ai',
    subcategory: 'computer vision',
    source: 'youtube',
    url: 'https://www.youtube.com/watch?v=eMlx5fFNoYc',
    summary: `The sixth video in 3Blue1Brown's deep learning series, focused entirely on the attention mechanism that powers both language models and modern vision transformers. Using vivid animations, Grant Sanderson shows how attention allows tokens to "query" each other and update their representations based on context, rather than processing each token in isolation. The video bridges the gap between the mathematical formulation of attention and the intuition of why it works so well. Essential viewing for anyone who wants to understand how vision transformers like ViT apply the same ideas to image patches instead of words.`,
  },
  {
    category: 'ai',
    subcategory: 'computer vision',
    source: 'article',
    url: 'https://jalammar.github.io/illustrated-stable-diffusion/',
    summary: `Jay Alammar's illustrated guide to Stable Diffusion, the open-source image generation model that brought text-to-image AI to consumers. With over 30 original diagrams, the article explains the three main components: CLIP (the text encoder that turns prompts into embeddings), the U-Net diffusion model (which progressively denoises a latent image), and the VAE decoder (which maps the latent back to a pixel image). Alammar explains the latent diffusion trick that makes the model tractable to train and run on consumer hardware. This is the clearest conceptual walkthrough of how modern image generation models actually work under the hood.`,
  },

  // ── Guitar: Technique ────────────────────────────────────────────────────────

  {
    category: 'guitar',
    subcategory: 'guitar technique',
    source: 'article',
    url: 'https://www.justinguitar.com/guitar-lessons/beginner-day-1-guitar-quick-start-aw-007',
    summary: `JustinGuitar's Day 1 beginner lesson, the starting point of the world's most popular free guitar course. Justin Sandercoe covers the absolute basics: how to hold the guitar correctly, how to position the fretting hand to avoid muting strings, how to strum with a pick or fingers, and how to press down on frets cleanly. This lesson also introduces the D chord — typically the first chord beginners learn — and gives a practice routine for the first day. JustinGuitar is used by millions worldwide and is praised by professional guitarists including David Gilmour for its structured, jargon-free teaching style.`,
  },
  {
    category: 'guitar',
    subcategory: 'guitar technique',
    source: 'article',
    url: 'https://www.justinguitar.com/guitar-lessons/e-shape-barre-chords-major-4b-001',
    summary: `JustinGuitar's lesson on E-shape major barre chords — arguably the single most important technique milestone for intermediate guitarists. Barre chords allow you to play any major chord in any key simply by sliding the same shape up and down the fretboard. Justin explains the proper thumb placement, how to roll the index finger slightly to avoid buzzing strings, and a gradual strength-building practice approach. Mastering this shape unlocks hundreds of songs and removes the limitation of only playing open chords. The lesson includes diagrams, a practice routine, and common mistakes to avoid.`,
  },
  {
    category: 'guitar',
    subcategory: 'guitar technique',
    source: 'youtube',
    url: 'https://www.youtube.com/@PaulDavids',
    summary: `Paul Davids is a Dutch guitarist and educator with 3.6 million YouTube subscribers, known for his exceptionally clear teaching style and deep musicality. His channel covers beginner technique, advanced phrasing, tone chasing, and gear breakdowns. His most popular videos include "10 Things Beginner Guitarists Should Know" and a series on playing guitar with feeling rather than just technical accuracy. Paul bridges the gap between technique and musical expression better than almost any other guitar educator online, making his channel essential for players at any level who want to go beyond mechanical practice.`,
  },

  // ── Guitar: Music Theory ─────────────────────────────────────────────────────

  {
    category: 'guitar',
    subcategory: 'music theory for guitar',
    source: 'youtube',
    url: 'https://www.youtube.com/watch?v=3Ym7X_wCsPQ',
    summary: `Rick Beato's "What Makes This Song Great?" episode on Queen's Bohemian Rhapsody, one of the most popular episodes in his landmark music analysis series. Beato breaks down the harmonic structure of the song's shifting sections — ballad, operatic, hard rock — explaining how Freddie Mercury used unconventional chord progressions and key changes that shouldn't work on paper but are emotionally perfect. Brian May's guitar work, the multi-tracked vocal harmonies, and the production techniques are all analysed in detail. This episode demonstrates applied music theory in the context of a culturally iconic recording, making abstract theory concrete.`,
  },
  {
    category: 'guitar',
    subcategory: 'music theory for guitar',
    source: 'youtube',
    url: 'https://www.youtube.com/@RickBeato',
    summary: `Rick Beato's YouTube channel is one of the most respected music education resources online, with 5 million subscribers and coverage spanning music theory, ear training, gear, songwriting, and in-depth song analyses. A former major-label producer and Berklee-trained musician, Beato explains concepts like modes, chord extensions, voice leading, and the Nashville Number System in ways that are accessible to guitarists without formal training. His "What Makes This Song Great?" series deconstructs hit records by artists from Beatles to Tool, showing how theory explains emotional impact. Essential for any guitarist wanting to understand the music they play.`,
  },
  {
    category: 'guitar',
    subcategory: 'music theory for guitar',
    source: 'article',
    url: 'https://www.musictheoryacademy.com/understanding-music/the-circle-of-fifths/',
    summary: `A comprehensive, free guide to the Circle of Fifths — the most important visual tool in Western music theory. The article explains what the circle is, how the 12 major keys and their relative minors are arranged around it, and why keys that sit adjacent on the circle share almost all the same notes (making modulation between them sound smooth). For guitarists, the Circle of Fifths explains why certain chord progressions feel resolved, how to write songs that stay in key, and how to predict which chords will work together. Includes diagrams and practical examples applied directly to the guitar fretboard.`,
  },

  // ── Gardening: Vegetable Gardening ───────────────────────────────────────────

  {
    category: 'gardening',
    subcategory: 'vegetable gardening',
    source: 'youtube',
    url: 'https://www.youtube.com/@epicgardening',
    summary: `Epic Gardening is the most-watched gardening YouTube channel, run by Kevin Espiritu and his team. With 3.8 million subscribers and over 780 million total views, the channel covers everything from growing vegetables in small urban spaces to large-scale homestead food production. Kevin's most popular video — how to grow ginger in containers — has 11 million views alone. The channel's approach is practical, science-backed, and beginner-friendly, covering soil preparation, companion planting, pest management, and harvest timing. Epic Gardening also produces a popular podcast and has grown into a full gardening media brand.`,
  },
  {
    category: 'gardening',
    subcategory: 'vegetable gardening',
    source: 'youtube',
    url: 'https://www.youtube.com/@CharlesDowding',
    summary: `Charles Dowding is the leading authority on no-dig gardening — a method of growing vegetables without tilling the soil, instead layering compost on top. His YouTube channel documents decades of practical experiments at his Homeacres farm in Somerset, England, comparing dig versus no-dig beds side by side. His videos show significantly higher yields and healthier soil structure in no-dig plots. Dowding covers salads, brassicas, roots, and alliums, with detailed attention to timing, spacing, and compost quality. His calm, evidence-based teaching style has built a global following among gardeners wanting to grow more food with less labour.`,
  },
  {
    category: 'gardening',
    subcategory: 'vegetable gardening',
    source: 'article',
    url: 'https://www.epicgardening.com/vegetable-garden-layout/',
    summary: `Epic Gardening's step-by-step guide to planning a vegetable garden layout, written by certified master gardener Kevin Espiritu. The article covers the main layout styles — rows, raised beds, square-foot gardening, and keyhole beds — with diagrams showing the pros and cons of each. It explains how to account for sun direction, crop rotation to prevent disease buildup, companion planting relationships, and spacing requirements for different vegetables. The guide helps beginners avoid the most common planning mistakes: overcrowding, poor sun placement, and planting incompatible crops near each other. Practical and actionable for any garden size.`,
  },

  // ── Gardening: Indoor Plants ─────────────────────────────────────────────────

  {
    category: 'gardening',
    subcategory: 'indoor plants',
    source: 'youtube',
    url: 'https://www.youtube.com/@Planterina',
    summary: `Planterina is one of the most popular houseplant YouTube channels with 868,000 subscribers and over 131 million views. Run by Amanda Switzer, the channel focuses on practical plant care for common and rare houseplants — Monsteras, Pothos, Snake Plants, Fiddle Leaf Figs, and succulents. Videos cover watering schedules, light requirements, repotting, propagation, and diagnosing common problems like root rot, yellowing leaves, and pests. Planterina's teaching style is warm and accessible, making it an excellent resource for anyone building an indoor plant collection or trying to revive struggling houseplants.`,
  },
  {
    category: 'gardening',
    subcategory: 'indoor plants',
    source: 'youtube',
    url: 'https://www.youtube.com/@homesteadbrooklyn',
    summary: `Summer Rayne Oakes runs the Homestead Brooklyn channel, documenting her 1,000+ plant apartment in Brooklyn and sharing deep-dive plant care knowledge. With 15 million annual views and her "Plant One On Me" series, Summer covers advanced topics like soil microbiology, watering science, and the care needs of rare tropical species alongside everyday houseplants. She brings a science background (environmental science and entomology) to plant care, explaining the biology behind why plants behave as they do. Her content is ideal for intermediate to advanced indoor gardeners who want to understand the "why" behind plant care advice.`,
  },

  // ── Gardening: Composting & Soil ─────────────────────────────────────────────

  {
    category: 'gardening',
    subcategory: 'composting and soil',
    source: 'article',
    url: 'https://ed.ted.com/lessons/vermicomposting-how-worms-can-reduce-our-waste-matthew-ross',
    summary: `A TED-Ed animated lesson explaining vermicomposting — the process of using worms to convert kitchen scraps and organic waste into nutrient-rich compost. The lesson covers the biology of red wigglers (Eisenia fetida), how they break down organic matter faster than traditional composting, what to feed them and what to avoid, and how to set up and maintain a worm bin at home. It also explains the broader environmental impact: food waste is one of the largest contributors to landfill methane emissions, and vermicomposting offers a practical household solution. Clear, visual, and science-grounded — an ideal introduction to worm composting.`,
  },
  {
    category: 'gardening',
    subcategory: 'composting and soil',
    source: 'article',
    url: 'https://www.epicgardening.com/start-raised-bed-garden/',
    summary: `Epic Gardening's complete guide to starting a raised bed garden, from choosing the right location and materials to filling it with the ideal soil mix. The article explains the "Mel's Mix" formula (compost, vermiculite, peat moss), why native garden soil should never be used in raised beds, and how to calculate how much material you need. It covers choosing between wood, metal, and plastic frames, optimal bed dimensions for reaching the centre without stepping in, and the drainage requirements that make raised beds more productive than in-ground planting in most climates. A practical, budget-conscious starting guide.`,
  },

  // ── Gardening: Garden Design & Layout ────────────────────────────────────────

  {
    category: 'gardening',
    subcategory: 'garden design and layout',
    source: 'article',
    url: 'https://www.epicgardening.com/raised-bed-garden-design/',
    summary: `Epic Gardening's guide to raised bed design ideas, covering 13 different configurations from simple single-bed setups to elaborate multi-bed kitchen gardens with paths. The article discusses the aesthetics and practicality of different materials (cedar, galvanised metal, concrete blocks), how to arrange beds to maximise access and airflow, and how to incorporate trellises and vertical growing structures. It also covers the importance of pathways — both for access and for preventing soil compaction — and offers spacing guidelines that balance growing space with usability. Useful for both first-time bed builders and gardeners redesigning an existing layout.`,
  },
  {
    category: 'gardening',
    subcategory: 'garden design and layout',
    source: 'youtube',
    url: 'https://www.youtube.com/@GardenAnswer',
    summary: `Garden Answer is run by Laura LeBoutillier and her husband Aaron, documenting the creation and evolution of their large property garden in Oregon. With 2 million subscribers and 581 million total views, the channel is known for beautiful garden design, real-time planting walkthroughs, seasonal overviews, and honest reviews of plants that thrive or fail in their climate. Laura's content spans perennial bed design, container gardening, front yard curb appeal, and large-scale landscape planning. The channel's production quality and the genuine "this is what actually works" approach make it one of the most inspiring and practical garden design channels on YouTube.`,
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
    const label = `[${i + 1}/${NODES.length}] ${node.subcategory} — ${node.url.slice(0, 60)}`;
    process.stdout.write(`${label} ... `);

    try {
      // Generate 768-dim embedding from the summary
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
