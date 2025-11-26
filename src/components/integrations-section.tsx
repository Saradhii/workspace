import { Gemini, Replit, MagicUI, VSCodium, MediaWiki, GooglePaLM } from '@/components/logos'
import { LogoIcon } from '@/components/logo-icon'
import { cn } from '@/lib/utils'

export default function IntegrationsSection() {
    return (
        <div className="relative mx-auto flex max-w-[200px] items-center justify-center" style={{ aspectRatio: '16 / 10' }}>
            <div
                role="presentation"
                className="absolute inset-0 z-10 aspect-square animate-spin items-center justify-center rounded-full border-t border-gray-200 opacity-0 duration-[3.5s] group-hover:opacity-100 dark:border-white/5 bg-gradient-to-b from-lime-500/15 to-transparent bg-[length:100%_25%]"></div>
            <div
                role="presentation"
                className="absolute inset-8 z-10 aspect-square scale-90 animate-spin items-center justify-center rounded-full border-t border-gray-200 opacity-0 duration-[3.5s] group-hover:opacity-100 dark:border-white/5 bg-gradient-to-b from-blue-500/15 to-transparent bg-[length:100%_25%]"></div>
            <div className="absolute inset-0 flex aspect-square items-center justify-center rounded-full border-t border-gray-200 bg-gradient-to-b from-gray-400/15 to-transparent bg-[length:100%_25%] dark:border-white/5">
                <IntegrationCard className="-translate-x-1/6 absolute left-0 top-1/4 -translate-y-1/4">
                    <Gemini />
                </IntegrationCard>
                <IntegrationCard className="absolute top-0 -translate-y-1/2">
                    <Replit />
                </IntegrationCard>
                <IntegrationCard className="translate-x-1/6 absolute right-0 top-1/4 -translate-y-1/4">
                    <MagicUI />
                </IntegrationCard>
            </div>
            <div className="absolute inset-8 flex aspect-square scale-90 items-center justify-center rounded-full border-t border-gray-200 bg-gradient-to-b from-gray-400/15 to-transparent bg-[length:100%_25%] dark:border-white/5">
                <IntegrationCard className="absolute top-0 -translate-y-1/2">
                    <VSCodium />
                </IntegrationCard>
                <IntegrationCard className="absolute left-0 top-1/4 -translate-x-1/4 -translate-y-1/4">
                    <MediaWiki />
                </IntegrationCard>
                <IntegrationCard className="absolute right-0 top-1/4 -translate-y-1/4 translate-x-1/4">
                    <GooglePaLM />
                </IntegrationCard>
            </div>
            <div className="absolute inset-x-0 bottom-0 mx-auto my-2 flex w-fit justify-center gap-2">
                <div className="bg-muted relative z-20 rounded-full border p-1">
                    <IntegrationCard
                        className="shadow-black-950/10 dark:bg-background size-16 border-black/20 shadow-xl dark:border-white/25 dark:shadow-white/15"
                        isCenter={true}>
                        <LogoIcon className="text-blue-500" />
                    </IntegrationCard>
                </div>
            </div>
        </div>
    )
}

const IntegrationCard = ({ children, className, isCenter = false }: { children: React.ReactNode; className?: string; isCenter?: boolean }) => {
    return (
        <div className={cn('relative z-30 flex size-12 rounded-full border bg-white shadow-sm shadow-black/5 dark:bg-white/5 dark:backdrop-blur-md', className)}>
            <div className={cn('m-auto size-fit *:size-5', isCenter && '*:size-8')}>{children}</div>
        </div>
    )
}