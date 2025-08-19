"use client"

import * as React from "react"
import { Check, Spinner, Lock, ChevronRight, Play, type Icon } from "@mynaui/icons-react"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { markStepAsCompleted } from "@/services/agents"

function getStatusIcon(status: string, isDark: boolean) {
  switch (status) {
    case "completed":
      return <Check className={`h-4 w-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
    case "available":
      return <Play className={`h-4 w-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
    case "in_progress":
      return <Spinner className={`h-4 w-4 ${isDark ? 'text-blue-400' : 'text-blue-600'} animate-spin`} />
    case "locked":
      return <Lock className={`h-4 w-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
    default:
      return <Play className={`h-4 w-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
  }
}

export function NavMain({
  items,
}: {
  items: {
    title: string
    url?: string
    icon?: Icon
    status?: string
    progress?: number
    isActive?: boolean
    isExpandedByDefault?: boolean
    items?: {
      title: string
      url: string
      status?: string
    }[]
  }[]
}) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})
  const pathname = usePathname()
  const router = useRouter()
  const { resolvedTheme } = useTheme()

  // Set expanded state for items that should be expanded by default
  React.useEffect(() => {
    const newState: Record<string, boolean> = {}
    items.forEach(item => {
      if (item.isExpandedByDefault) {
        newState[item.title] = true
      }
    })
    setOpenItems(newState)
  }, [items])

  const handleItemClick = (item: any, e: React.MouseEvent) => {
    // If item has no URL (parent category), prevent navigation
    if (!item.url) {
      e.preventDefault()
      return
    }
    
    // Prevent navigation if item is locked or in progress
    if (item.status === 'locked' || item.status === 'in_progress') {
      e.preventDefault()
      return
    }
    
    // If item is available, mark it as completed when they start working on it
    // For brand identity, we'll mark it as completed only after they generate the brand identity
    if (item.status === 'available') {
      const stepKey = getStepKey(item.title)
      if (stepKey && stepKey !== 'brand_identity') {
        // Don't mark brand identity as completed on click, only after generation
        markStepAsCompleted(stepKey)
      }
    }
    
    // Navigate manually
    router.push(item.url)
  }

  const getStepKey = (title: string): keyof import('@/services/agents').WorkflowStatus | null => {
    const stepMap: Record<string, keyof import('@/services/agents').WorkflowStatus> = {
      'Ideation': 'ideation',
      'Viability Assessment': 'viability_assessment',
      'SWOT Analysis': 'swot_analysis',
      'Business Model Canvas': 'bmc',
      'Brand Identity': 'brand_identity',
      'Marketing Strategy': 'marketing_strategy',
      'Pitch Deck': 'pitch_deck',
    }
    return stepMap[title] || null
  }

  const toggleItem = (title: string) => {
    setOpenItems(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }

  const isCurrentPage = (url?: string) => {
    return url ? pathname === url : false
  }

  const getItemStyles = (item: any) => {
    const isCurrent = isCurrentPage(item.url)

    if (isCurrent) {
      return "bg-white dark:bg-muted text-gray-900 dark:text-foreground border border-border/20 dark:border-border"
    }
    
    // If item has no URL, show as non-clickable
    if (!item.url) {
      return "text-sidebar-foreground cursor-default"
    }
    
    // If item is locked, make it non-clickable and dim
    if (item.status === 'locked') {
      return "text-muted-foreground cursor-not-allowed opacity-60"
    }
    
    // Available and completed items should be fully interactive
    return "hover:bg-sidebar-accent/50 text-sidebar-foreground cursor-pointer"
  }

  const getIconStyles = (item: any) => {
    const isCurrent = isCurrentPage(item.url)
    
    if (isCurrent) {
      return "text-primary"
    }
    
    // Locked items should be dimmed
    if (item.status === 'locked') {
      return "text-muted-foreground"
    }
    
    // Available and completed items should be normal
    return "text-muted-foreground"
  }

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-600 dark:text-emerald-400"
      case "in_progress":
        return "text-blue-600 dark:text-blue-400"
      case "locked":
        return "text-slate-400 dark:text-slate-500"
      default:
        return "text-amber-600 dark:text-amber-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed"
      case "in_progress":
        return "In Progress"
      case "locked":
        return "Locked"
      case "available":
        return "Ready"
      default:
        return "Ready"
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => (
            <Collapsible
              key={`${item.title}-${pathname}`}
              open={openItems[item.title]}
              onOpenChange={() => toggleItem(item.title)}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    className={`w-full h-14 px-3 rounded-lg transition-all duration-200 ${getItemStyles(item)} ${
                      item.status === 'locked' ? 'pointer-events-none' : ''
                    }`}
                    asChild={!!item.url && item.status !== 'locked'}
                  >
                    {item.url && item.status !== 'locked' ? (
                      <a href={item.url} className="flex items-center gap-3 w-full" onClick={(e) => handleItemClick(item, e)}>
                        <div className="flex items-center gap-3 flex-1">
                          {item.icon && (
                            <item.icon className={`h-5 w-5 shrink-0 ${getIconStyles(item)}`} />
                          )}
                          <div className="flex flex-col items-start">
                            <span className="truncate font-medium text-sm leading-tight">{item.title}</span>
                            <span className={`text-xs font-medium ${getStatusTextColor(item.status || "")}`}>
                              {getStatusText(item.status || "")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusIcon(item.status || "", resolvedTheme === 'dark')}
                          {item.items && item.items.length > 0 && (
                            <ChevronRight 
                              className={`h-4 w-4 transition-transform duration-200 ${
                                openItems[item.title] ? 'rotate-90' : ''
                              }`} 
                            />
                          )}
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center gap-3 flex-1">
                          {item.icon && (
                            <item.icon className={`h-5 w-5 shrink-0 ${getIconStyles(item)}`} />
                          )}
                          <div className="flex flex-col items-start">
                            <span className="truncate font-medium text-sm leading-tight">{item.title}</span>
                            <span className={`text-xs font-medium ${getStatusTextColor(item.status || "")}`}>
                              {getStatusText(item.status || "")}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {getStatusIcon(item.status || "", resolvedTheme === 'dark')}
                          {item.items && item.items.length > 0 && (
                            <ChevronRight 
                              className={`h-4 w-4 transition-transform duration-200 ${
                                openItems[item.title] ? 'rotate-90' : ''
                              }`} 
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                
                {item.items && item.items.length > 0 && (
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-6 mt-2 space-y-1">
                      {item.items.map((subItem, index) => (
                        <SidebarMenuSubItem key={subItem.title} className="relative">
                          <SidebarMenuSubButton asChild>
                            {subItem.status !== 'locked' ? (
                              <a 
                                href={subItem.url} 
                                className={`flex items-center gap-3 w-full h-10 px-3 rounded-md transition-all duration-200 group ${
                                  isCurrentPage(subItem.url)
                                    ? 'bg-white dark:bg-muted text-gray-900 dark:text-foreground border border-border/20 dark:border-border'
                                    : 'hover:bg-sidebar-accent/30'
                                }`}
                              >
                                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                  {index + 1}.
                                </span>
                                <span className="truncate flex-1 text-sm group-hover:text-foreground transition-colors">
                                  {subItem.title}
                                </span>
                                <div className="flex items-center gap-2 shrink-0">
                                  {getStatusIcon(subItem.status || "", resolvedTheme === 'dark')}
                                </div>
                              </a>
                            ) : (
                              <div className={`flex items-center gap-3 w-full h-10 px-3 rounded-md cursor-not-allowed opacity-60 text-muted-foreground`}>
                                <span className="text-xs text-muted-foreground">
                                  {index + 1}.
                                </span>
                                <span className="truncate flex-1 text-sm">
                                  {subItem.title}
                                </span>
                                <div className="flex items-center gap-2 shrink-0">
                                  {getStatusIcon(subItem.status || "", resolvedTheme === 'dark')}
                                </div>
                              </div>
                            )}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
