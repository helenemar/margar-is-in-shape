export type FeedActivity = {
  id: string
  sport: string
  duree_minutes: number
}

export type FeedComment = {
  id: string
  user_id: string
  prenom: string
  texte: string
  created_at: string
}

export type FeedCheckin = {
  id: string
  user_id: string
  prenom: string
  date: string
  alimentation: string
  nb_verres_alcool: number
  photo_url: string | null
  activities: FeedActivity[]
  comments: FeedComment[]
  kudos_count: number
  i_kudosed: boolean
  created_at: string
}
