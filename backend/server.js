const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC_DIR = path.join(__dirname, 'public');

const flows = {
  initial: {
    message:
      'Hi, I am the Accel Digital assistant. Ready to help you explore our capabilities, success stories, and next steps.',
    options: [
      { label: 'Get Started', intent: 'get_started' },
      { label: 'Learn More', intent: 'learn_more' },
      { label: 'Services', intent: 'services' },
      { label: 'Contact Us', intent: 'contact' }
    ]
  },
  get_started: {
    message: 'Great! What would you like to focus on first?',
    options: [
      { label: 'Understand our approach', intent: 'learn_more' },
      { label: 'Review services', intent: 'services' },
      { label: 'Talk to a strategist', intent: 'contact' }
    ]
  },
  learn_more: {
    message:
      'Accel Digital blends research, experience design, and engineering to launch bold digital initiatives fast. We partner with scale-ups and enterprises to remove friction from modern customer journeys.',
    options: [
      { label: 'View Services', intent: 'services' },
      { label: 'See case studies', intent: 'case_studies' },
      { label: 'Engage our team', intent: 'contact' }
    ],
    toast: 'Overview loaded — pick what to explore next.'
  },
  case_studies: {
    message:
      'Recent wins: 45% lift in qualified pipeline for a B2B SaaS leader, global commerce revamp for an athleisure brand, and a GenAI CX assistant rolled out in 6 weeks.',
    options: [
      { label: 'Growth stories', intent: 'service_growth' },
      { label: 'Experience stories', intent: 'service_experience' },
      { label: 'Back to start', intent: 'initial' }
    ]
  },
  services: {
    message: 'We orchestrate end-to-end value. Choose a capability to dive deeper.',
    options: [
      { label: 'Strategy & Research', intent: 'service_strategy' },
      { label: 'Experience & Product', intent: 'service_experience' },
      { label: 'Growth & GTM', intent: 'service_growth' },
      { label: 'AI Acceleration', intent: 'service_ai' },
      { label: 'Contact Us', intent: 'contact' }
    ]
  },
  service_strategy: {
    message:
      'Strategy & Research: opportunity mapping, product-market validation, CX vision sprints, and operating model design to align stakeholders fast.',
    options: [
      { label: 'Experience Design', intent: 'service_experience' },
      { label: 'Book a strategy call', intent: 'contact' },
      { label: 'Back to services', intent: 'services' }
    ]
  },
  service_experience: {
    message:
      'Experience & Product: full-stack product design, prototyping, accessibility audits, and platform builds guided by measurable outcomes.',
    options: [
      { label: 'Growth Programs', intent: 'service_growth' },
      { label: 'AI Accelerators', intent: 'service_ai' },
      { label: 'Back to services', intent: 'services' }
    ]
  },
  service_growth: {
    message:
      'Growth & GTM: lifecycle marketing, RevOps consulting, conversion experimentation, and analytics instrumentation for always-on optimization.',
    options: [
      { label: 'AI Accelerators', intent: 'service_ai' },
      { label: 'Talk to revenue lead', intent: 'contact' },
      { label: 'Restart conversation', intent: 'initial' }
    ]
  },
  service_ai: {
    message:
      'AI Acceleration: discovery workshops, data readiness assessments, prototype build-outs, and production deployments with governance baked in.',
    options: [
      { label: 'Schedule workshop', intent: 'contact' },
      { label: 'Back to services', intent: 'services' },
      { label: 'Start over', intent: 'initial' }
    ],
    toast: 'AI playbook ready — let us know if you want a live walkthrough.'
  },
  contact: {
    message:
      'Amazing! Drop a note to hello@accel-digital.com or share a preferred time and channel. We respond within one business day.',
    options: [
      { label: 'Share availability', intent: 'contact_schedule' },
      { label: 'Email us', intent: 'contact_email' },
      { label: 'Return home', intent: 'initial' }
    ],
    toast: 'We will follow up as soon as you confirm the details.'
  },
  contact_schedule: {
    message:
      'Pick a 30-minute slot and we will send a calendar invite with an agenda tailored to your priorities.',
    options: [
      { label: 'Send calendar link', intent: 'contact_email' },
      { label: 'Talk services again', intent: 'services' },
      { label: 'Back to start', intent: 'initial' }
    ]
  },
  contact_email: {
    message:
      'Perfect — email hello@accel-digital.com with your goals, timeline, and success metrics. We will reply with next steps and a tailored squad.',
    options: [
      { label: 'Explore services', intent: 'services' },
      { label: 'Restart', intent: 'initial' }
    ],
    toast: 'Email template copied to your clipboard? If not, we can send it manually.'
  }
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) {
        req.destroy(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJSON(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function handleApi(req, res, urlObj) {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.method === 'POST' && urlObj.pathname === '/api/chat') {
    parseBody(req)
      .then(body => {
        const intent = typeof body.intent === 'string' && body.intent.trim() ? body.intent.trim() : 'initial';
        const node = flows[intent] || {
          message: 'I did not catch that. Let us jump back to the main menu.',
          options: flows.initial.options
        };
        sendJSON(res, 200, node);
      })
      .catch(err => {
        sendJSON(res, 400, { message: err.message, options: flows.initial.options });
      });
    return;
  }

  sendJSON(res, 404, { message: 'Route not found', options: flows.initial.options });
}

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);

  if (urlObj.pathname.startsWith('/api/')) {
    handleApi(req, res, urlObj);
    return;
  }

  let filePath = path.join(PUBLIC_DIR, urlObj.pathname === '/' ? 'index.html' : urlObj.pathname);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Access denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (urlObj.pathname !== '/' && !path.extname(urlObj.pathname)) {
        serveStaticFile(res, path.join(PUBLIC_DIR, 'index.html'));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      }
      return;
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    serveStaticFile(res, filePath);
  });
});

server.listen(PORT, HOST, () => {
  const printableHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(`Server listening on http://${printableHost}:${PORT}`);
});
