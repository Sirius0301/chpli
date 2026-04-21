export interface Tag {
  id: string
  user_id: string
  name: string
  description?: string
  created_at: string
}

export interface TagCreateInput {
  name: string
  description?: string
}

export interface TagUpdateInput {
  name?: string
  description?: string
}

export interface Bookmark {
  id: string
  user_id: string
  url: string
  title: string
  description?: string
  click_count: number
  last_clicked_at?: string
  is_required: boolean
  is_deleted: boolean
  deleted_at?: string
  dismissed_until?: string
  created_at: string
  updated_at: string
  tags: Tag[]
}

export interface BookmarkCreateInput {
  url: string
  title: string
  description?: string
  tag_ids?: string[]
}

export interface BookmarkUpdateInput {
  url?: string
  title?: string
  description?: string
  tag_ids?: string[]
}

export interface SuggestionItem {
  bookmark: Bookmark
  days_since_click?: number
}
