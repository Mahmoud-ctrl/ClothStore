const Footer = () => {
    return(
         <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">FashionHub</h3>
              <p className="text-primary-foreground/80">
                Curated fashion for the modern individual. Timeless pieces that define elegance.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Shop</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li>Men</li>
                <li>Women</li>
                <li>New Arrivals</li>
                <li>Sale</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Support</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li>Size Guide</li>
                <li>Shipping</li>
                <li>Returns</li>
                <li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Connect</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li>Instagram</li>
                <li>Twitter</li>
                <li>Newsletter</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/60">
            <p>&copy; 2025 FashionHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    )
}

export default Footer