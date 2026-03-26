"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Fab, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  IconButton,
  Typography,
  Box,
  CircularProgress
} from "@mui/material";
import { Lightbulb, Mic, MicOff, Send, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";

export function QuickIdeaFab({ isMobile = false }: { isMobile?: boolean }) {
  const { t } = useLanguage();
  const { createQuickIdea } = useDashboardWorkspace();
  const [open, setOpen] = useState(false);
  const [ideaText, setIdeaText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // SpeechRecognition is not fully supported in all browsers, so we handle it gracefully
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition if available
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < (event.results?.length ?? 0); i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              setIdeaText((prev) => prev + transcript + " ");
            } else {
              currentTranscript += transcript;
            }
          }
          // We could show interim results, but for simplicity we append final
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
        };
        
        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
        } catch (e) {
          console.error("Could not start recording", e);
        }
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const handleSave = async () => {
    if (!ideaText.trim()) return;
    
    setIsSaving(true);
    try {
      await createQuickIdea(ideaText);
      setIdeaText("");
      setOpen(false);
    } catch (e) {
      console.error("Failed to save idea", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="quick idea"
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          bottom: isMobile ? 88 : 32,
          right: isMobile ? 16 : 32,
          display: "flex",
          zIndex: 1000,
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          boxShadow: isMobile ? "0 4px 16px rgba(16, 185, 129, 0.3)" : "0 8px 32px rgba(16, 185, 129, 0.4)",
          '&:hover': {
            background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
            boxShadow: "0 12px 48px rgba(16, 185, 129, 0.5)",
            transform: isMobile ? 'scale(1.05)' : 'scale(1.1) rotate(5deg)',
          },
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          width: isMobile ? 48 : 56,
          height: isMobile ? 48 : 56,
        }}
      >
        <Lightbulb />
      </Fab>

      <Dialog 
        open={open} 
        onClose={() => !isSaving && setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: "background.paper",
            backgroundImage: "none",
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lightbulb className="text-[var(--primary)]" size={20} />
            <Typography variant="h6" fontWeight="bold">Quick Idea</Typography>
          </Box>
          <IconButton onClick={() => setOpen(false)} size="small" disabled={isSaving}>
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 2 }}>
          <TextField
            autoFocus
            multiline
            rows={4}
            placeholder="Type your idea or record your voice..."
            variant="outlined"
            fullWidth
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            disabled={isSaving}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
          <IconButton 
            onClick={toggleRecording} 
            disabled={isSaving}
            color={isRecording ? "error" : "default"}
            sx={{ 
              bgcolor: isRecording ? 'error.light' : 'action.hover',
              '&:hover': { bgcolor: isRecording ? 'error.main' : 'action.selected' }
            }}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </IconButton>
          
          <Button 
            variant="contained" 
            onClick={handleSave}
            disabled={!ideaText.trim() || isSaving}
            endIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Send size={16} />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: 'var(--primary)',
              '&:hover': { opacity: 0.9 }
            }}
          >
            Save Idea
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
