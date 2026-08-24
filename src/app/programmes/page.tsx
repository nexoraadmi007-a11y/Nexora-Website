import { PublicShell } from '@/components/shell'
import { ButtonLink, Card, Section } from '@/components/ui'
import { formatNaira, programmes } from '@/config/programmes'
export default function CoursesPage() { return <PublicShell><Section eyebrow="Courses" title="Choose the AI course you want to learn."><p className="lead">Select one, two, or all three. Every course has its own enrolment, classes and assignments.</p><div className="grid-3">{programmes.map((course) => <Card key={course.code}><h3>{course.name}</h3><p className="muted">{course.proposition}</p><p className="price">{formatNaira(course.priceNgn)}</p><ButtonLink href={`/checkout?course=${course.slug}`}>Select Course</ButtonLink></Card>)}</div></Section></PublicShell> }
