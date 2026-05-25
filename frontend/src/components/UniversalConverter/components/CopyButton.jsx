import { useState, useCallback } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';

export default function CopyButton({ text, size = 'small', label = 'Copy' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text && text !== 0) return;
    try {
      await navigator.clipboard.writeText(String(text));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = String(text);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [text]);

  return (
    <Tooltip title={copied ? 'Copied!' : label} arrow>
      <IconButton
        size={size}
        onClick={handleCopy}
        color={copied ? 'success' : 'default'}
        aria-label={label}
        sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
      >
        {copied ? <CheckIcon fontSize={size} /> : <ContentCopyIcon fontSize={size} />}
      </IconButton>
    </Tooltip>
  );
}
