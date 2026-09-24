import {
  Activity,
  Bot,
  Cloud,
  MessageSquare,
  Mic,
  Pin,
  PinOff,
  Plus,
  Settings,
  Sparkles,
  Volume2,
} from 'lucide-react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/kreo/ui/Command'

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pinned: boolean
  onGoToChat: () => void
  onGoToSettings: (section: string) => void
  onTogglePin: () => void
  onNewThread: () => void
  onOpenOnboarding: () => void
  onRunDiagnostics: () => void
}

export function CommandPalette({
  open,
  onOpenChange,
  pinned,
  onGoToChat,
  onGoToSettings,
  onTogglePin,
  onNewThread,
  onOpenOnboarding,
  onRunDiagnostics,
}: CommandPaletteProps) {
  const run = (action: () => void) => {
    action()
    onOpenChange(false)
  }

  return (
    <CommandDialog
      visible={open}
      onHide={() => onOpenChange(false)}
      title="Paleta de comandos"
      description="Navega y ejecuta acciones rápidas"
      size="md"
      showClose={false}
      className="mac-command-palette"
    >
      <CommandInput placeholder="Buscar comando…" />
      <CommandList>
        <CommandEmpty>Sin resultados.</CommandEmpty>

        <CommandGroup heading="Navegación">
          <CommandItem onSelect={() => run(onGoToChat)}>
            <MessageSquare />
            <span>Ir a Chat</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onGoToSettings('providers'))}>
            <Settings />
            <span>Ir a Ajustes</span>
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Ajustes">
          <CommandItem onSelect={() => run(() => onGoToSettings('providers'))}>
            <Cloud />
            <span>Proveedores</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onGoToSettings('agents'))}>
            <Bot />
            <span>Agentes</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onGoToSettings('voice'))}>
            <Volume2 />
            <span>Voz</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onGoToSettings('audio'))}>
            <Mic />
            <span>Audio</span>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onGoToSettings('system'))}>
            <Activity />
            <span>Sistema (diagnóstico)</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Acciones">
          <CommandItem onSelect={() => run(onNewThread)}>
            <Plus />
            <span>Nuevo hilo</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(onTogglePin)}>
            {pinned ? <PinOff /> : <Pin />}
            <span>{pinned ? 'Desanclar ventana' : 'Anclar ventana'}</span>
          </CommandItem>
          <CommandItem onSelect={() => run(onOpenOnboarding)}>
            <Sparkles />
            <span>Abrir Setup Assistant</span>
          </CommandItem>
          <CommandItem onSelect={() => run(onRunDiagnostics)}>
            <Activity />
            <span>Ejecutar diagnóstico</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
