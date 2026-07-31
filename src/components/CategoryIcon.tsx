import * as LucideIcons from 'lucide-react'
import { Tag, LucideProps } from 'lucide-react'

// Ionicons names (used by the mobile app, e.g. saving goal icons) that don't
// map 1:1 onto a same-named Lucide icon.
const IONICON_ALIASES: Record<string, string> = {
  airplane: 'Plane',
  medkit: 'Stethoscope',
  school: 'GraduationCap',
  'game-controller': 'Gamepad2',
  'phone-portrait': 'Smartphone',
  cart: 'ShoppingCart',
  basket: 'ShoppingBasket',
  bag: 'ShoppingBag',
  fitness: 'Dumbbell',
  car: 'Car',
  home: 'Home',
  wallet: 'Wallet',
  gift: 'Gift',
  book: 'Book',
  heart: 'Heart',
  restaurant: 'UtensilsCrossed',
  cafe: 'Coffee',
  paw: 'PawPrint',
  briefcase: 'Briefcase',
  tool: 'Wrench',
  'car-sport': 'CarFront',
  cash: 'Banknote',
  laptop: 'Laptop',
}

function toPascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')
}

export default function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const pascal = IONICON_ALIASES[name] ?? toPascalCase(name)
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[pascal] ?? Tag
  return <Icon {...props} />
}
