import { cn } from "@/lib/utils";

const members = [
  {
    name: "John Doe",
    role: "Creative Lead",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/portraits/alexander-hipp-iEEBWgY_6lA-unsplash.jpg",
  },
  {
    name: "Marcus Walker",
    role: "Product Manager",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/portraits/christian-buehner-DItYlc26zVI-unsplash 1.jpg",
  },
  {
    name: "Sarah Johnson",
    role: "Tech Director",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/portraits/good-faces-xmSWVeGEnJw-unsplash.jpg",
  },
  {
    name: "James Mitchell",
    role: "Design Head",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/portraits/joseph-gonzalez-iFgRcqHznqg-unsplash.jpg",
  },
  {
    name: "Lisa Anderson",
    role: "Marketing Lead",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/portraits/michael-dam-mEZ3PoFGs_k-unsplash.jpg",
  },
  {
    name: "Ryan Thompson",
    role: "Operations Chief",
    image:
      "https://deifkwefumgah.cloudfront.net/shadcnblocks/block/portraits/nima-motaghian-nejad-_omdf_EgRUo-unsplash.jpg",
  },
];

const alumnis = [
  "Taylor Simmons",
  "Alex Martinez",
  "Morgan Davis",
  "Casey Brown",
  "Jordan Williams",
  "Riley Anderson",
  "Dakota Taylor",
  "Blake Roberts",
];

const collaborators = [
  "Cameron Lee",
  "Jordan Park",
  "Morgan Chen",
  "Skyler Kim",
  "Quinn Patel",
  "Sage Thompson",
  "River Jones",
  "Ocean Garcia",
];

interface Team17Props {
  className?: string;
}

const Team17 = ({ className }: Team17Props) => {
  return (
    <section className={cn("py-32", className)}>
      <div className="container">
        <h1 className="text-4xl font-medium">The Team Behind Our Success</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Our team is a group of talented individuals who are dedicated to
          delivering the best possible results for our clients.
        </p>
        <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3">
          {members.map((member, index) => (
            <div className="flex flex-col gap-4" key={index}>
              <img
                src={member.image}
                alt={member.name}
                className="aspect-[3/4] object-cover"
              />
              <div>
                <h2 className="text-sm font-medium">{member.name}</h2>
                <p className="text-sm text-muted-foreground">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-32 grid grid-cols-2 gap-x-6 gap-y-12 text-sm font-medium sm:grid-cols-3">
          <h2>Alumni</h2>
          <ul className="sm:col-span-2">
            {alumnis.map((alumni, index) => (
              <li key={index}>{alumni}</li>
            ))}
          </ul>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 text-sm font-medium sm:grid-cols-3">
          <h2>Collaborators</h2>
          <ul className="sm:col-span-2">
            {collaborators.map((collaborator, index) => (
              <li key={index}>{collaborator}</li>
            ))}
          </ul>
        </div>
        <div className="mt-14 grid grid-cols-3 gap-x-6 gap-y-6 sm:gap-x-12">
          <h2 className="col-span-3 text-sm font-medium sm:col-span-1">
            Culture
          </h2>
          <p className="col-span-3 sm:col-span-2 sm:text-lg">
            Since our founding, we've built a space where creativity thrives,
            boundaries expand, and everyone can bring their whole self to work.
            <br />
            <br />
            We champion autonomy, innovation, and genuine connection. We see
            work as an expression of purpose — something that enriches rather
            than drains. And we understand that breakthrough moments emerge from
            balance: when we're inspired, supported, and passionate about our
            craft. This is how we operate.
          </p>
        </div>
      </div>
    </section>
  );
};

export { Team17 };
