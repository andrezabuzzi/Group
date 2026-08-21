import re

with open('src/views/Financeiro/DespesasFixas.tsx', 'r') as f:
    content = f.read()

# Find the start of the component body to add state
state_regex = re.compile(r'(const \[expenses, setExpenses\] = useState<any\[\]>\(\[\]\);)')
match = state_regex.search(content)

if match:
    pin_state = """const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  """
    content = content.replace(match.group(1), pin_state + match.group(1))

# Find the Eye button toggle logic
eye_regex = re.compile(r'onClick=\{\(\) => setPrivacyMode\(!privacyMode\)\}')
content = eye_regex.sub('onClick={togglePrivacy}', content)

# Add togglePrivacy and handlePinSubmit functions
funcs = """  const togglePrivacy = () => {
    if (privacyMode) {
      setPinDialogOpen(true);
    } else {
      setPrivacyMode(true);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const savedPin = localStorage.getItem('app_pin') || '1234';
    if (pinInput === savedPin) {
      setPrivacyMode(false);
      setPinDialogOpen(false);
      setPinInput('');
      toast.success('Visualização liberada');
    } else {
      toast.error('PIN Incorreto');
      setPinInput('');
    }
  };
"""

# Insert before useEffects
use_effect_regex = re.compile(r'(useEffect\(\(\) => \{)')
match = use_effect_regex.search(content)
if match:
    # replace first occurrence
    content = content[:match.start()] + funcs + content[match.start():]

# Add the PinDialog JSX at the end of the return statement (before the last closing tag)
dialog_regex = re.compile(r'(</Dialog>\s*</div>\s*\);\s*\})', re.DOTALL)
match = dialog_regex.search(content)

pin_dialog_jsx = """
      {/* Pin Modal */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#181B24] border border-[#ECEFF5] dark:border-white/5 rounded-[24px] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="w-16 h-16 bg-[#6D4AFF]/10 rounded-full flex items-center justify-center mb-2">
              <Eye className="w-8 h-8 text-[#6D4AFF]" />
            </div>
            <div>
              <h2 className="text-[24px] font-bold text-[#111827] dark:text-white tracking-tight">Acesso Restrito</h2>
              <p className="text-[14px] text-[#6B7280] mt-2">
                Digite seu PIN de 4 dígitos para visualizar os valores.
              </p>
            </div>
            <form onSubmit={handlePinSubmit} className="w-full space-y-6 mt-4">
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••"
                className="text-center text-4xl tracking-[0.5em] font-mono rounded-[16px] h-[64px] bg-[#F6F7FB] dark:bg-[#12141C] border border-[#ECEFF5] dark:border-white/5 focus:border-[#6D4AFF]"
                autoFocus
              />
              <button 
                type="submit" 
                disabled={pinInput.length !== 4}
                className="w-full h-[56px] rounded-[16px] bg-[#6D4AFF] text-white font-bold text-[15px] shadow-[0_4px_14px_0_rgba(109,74,255,0.39)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Validar PIN
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
"""

if match:
    content = content.replace(match.group(1), pin_dialog_jsx + match.group(1))

with open('src/views/Financeiro/DespesasFixas.tsx', 'w') as f:
    f.write(content)

print("Pin logic added.")
