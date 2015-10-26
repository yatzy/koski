describe('TOR', function() {
  var page = TorPage()
  var login = LoginPage()
  var authentication = Authentication()
  var opinnot = OpinnotPage()
  var addOppija = AddOppijaPage()

  var eero = 'esimerkki, eero 010101-123N'
  var markkanen = 'markkanen, eero '
  var eerola = 'eerola, jouni '
  var teija = 'tekijä, teija 150995-914X'

  describe('Login-sivu', function() {
    before(login.openPage)
    it('näytetään, kun käyttäjä ei ole kirjautunut sisään', function() {
      expect(login.isVisible()).to.equal(true)
    })
    describe('Väärällä käyttäjätunnuksella', function() {
      before(login.login('fail', 'fail'))
      before(wait.until(login.isLoginErrorVisible))
      it('näytetään virheilmoitus', function() {})
    })
    describe('Onnistuneen loginin jälkeen', function() {
      before(login.login('kalle', 'asdf'))
      before(wait.until(page.isVisible))
      it('siirrytään TOR-etusivulle', function() {
        expect(page.isVisible()).to.equal(true)
      })
    })
  })

  describe('Oppijahaku', function() {
    before(authentication.login(), resetMocks, page.openPage)
    it('näytetään, kun käyttäjä on kirjautunut sisään', function() {
      expect(page.isVisible()).to.equal(true)
      expect(page.oppijaHaku.isNoResultsLabelShown()).to.equal(false)
    })
    describe('Hakutulos-lista', function() {
      it('on aluksi tyhjä', function() {
        expect(page.oppijaHaku.getSearchResults().length).to.equal(0)
      })
    })
    describe('Kun haku tuottaa yhden tuloksen', function() {
      before(page.oppijaHaku.search('esimerkki', 1))
      it('ensimmäinen tulos näytetään', function() {
        expect(page.oppijaHaku.getSearchResults()).to.deep.equal([eero])
        expect(page.oppijaHaku.isNoResultsLabelShown()).to.equal(false)
      })

      it('ensimmäinen tulos valitaan automaattisesti', wait.until(function() { return page.getSelectedOppija() == eero }))

      describe('Kun haku tuottaa uudestaan yhden tuloksen', function() {
        before(page.oppijaHaku.search('teija', 1))
        it('tulosta ei valita automaattisesti', function() {
          expect(page.getSelectedOppija()).to.equal(eero)
        })
      })
    })
    describe('Haun tyhjentäminen', function() {
      before(page.oppijaHaku.search('esimerkki', 1))
      before(page.oppijaHaku.search('', 0))

      it('säilyttää oppijavalinnan', function() {
        expect(page.getSelectedOppija()).to.equal(eero)
      })

      it('tyhjentää hakutulos-listauksen', function() {
        expect(page.oppijaHaku.getSearchResults().length).to.equal(0)
        expect(page.oppijaHaku.isNoResultsLabelShown()).to.equal(false)
      })
    })
    describe('Kun haku tuottaa useamman tuloksen', function() {
      before(page.oppijaHaku.search('eero', 3))

      it('Hakutulokset näytetään', function() {
        expect(page.oppijaHaku.getSearchResults()).to.deep.equal([eero, eerola, markkanen])
      })

      before(page.oppijaHaku.selectOppija('markkanen'))

      it('valitsee oppijan', function() {
        expect(page.getSelectedOppija()).to.equal(markkanen)
      })
    })

    describe('Kun haku ei tuota tuloksia', function() {
      before(page.oppijaHaku.search('asdf', page.oppijaHaku.isNoResultsLabelShown))

      it('Näytetään kuvaava teksti', function() {
        expect(page.oppijaHaku.isNoResultsLabelShown()).to.equal(true)
      })
    })

    describe('Kun haetaan olemassa olevaa henkilöä, jolla ei ole opinto-oikeuksia', function() {
      before(page.oppijaHaku.search('Presidentti', page.oppijaHaku.isNoResultsLabelShown))

      it('Tuloksia ei näytetä', function() {

      })
    })

    describe('Hakutavat', function() {
      it ('Hetulla, case-insensitive', function() {
        return page.oppijaHaku.search('010101-123n', [eero])()
      })
      it ('Nimen osalla, case-insensitive', function() {
        return page.oppijaHaku.search('JoU', [eerola])()
      })
      it ('Oidilla', function() {
        return page.oppijaHaku.search('1.2.246.562.24.00000000003', [markkanen])()
      })
    })
  })

  function prepareForNewOppija(username, searchString) {
    return function() {
      return resetMocks()
        .then(authentication.login(username))
        .then(page.openPage)
        .then(page.oppijaHaku.search(searchString, page.oppijaHaku.isNoResultsLabelShown))
        .then(page.oppijaHaku.addNewOppija)
    }
  }

  function addNewOppija(username, searchString, oppijaData) {
    return function() {
      return prepareForNewOppija(username, searchString)()
        .then(addOppija.enterValidData(oppijaData))
        .then(addOppija.submit)
        .then(wait.until(function() {
          return page.getSelectedOppija().indexOf(oppijaData.hetu) > 0
        }))
    }
  }

  describe('Opinto-oikeuden lisääminen', function() {
    describe('Olemassa olevalle henkilölle', function() {

      describe('Kun lisätään uusi opinto-oikeus', function() {
        before(addNewOppija('kalle', 'Tunkkila', { etunimet: 'Tero Terde', kutsumanimi: 'Terde', sukunimi: 'Tunkkila', hetu: '091095-9833', oppilaitos: 'Helsingin', tutkinto: 'auto'}))

        it('Onnistuu, näyttää henkilöpalvelussa olevat nimitiedot', function() {
          expect(page.getSelectedOppija()).to.equal('tunkkila, tero 091095-9833')
        })
      })

      describe('Kun lisätään opinto-oikeus, joka henkilöllä on jo olemassa', function() {
        before(addNewOppija('kalle', 'asdf', { etunimet: 'Eero Adolf', kutsumanimi: 'Eero', sukunimi: 'Esimerkki', hetu: '010101-123N', oppilaitos: 'Helsingin', tutkinto: 'auto'}))

        it('Näytetään olemassa oleva tutkinto', function() {
          expect(page.getSelectedOppija()).to.equal(eero)
          expect(opinnot.getTutkinto()).to.equal('Autoalan perustutkinto')
          expect(opinnot.getOppilaitos()).to.equal('Helsingin Ammattioppilaitos')
        })
      })
    })

    describe('Uudelle henkilölle', function() {
      before(prepareForNewOppija('kalle', 'asdf'))

      describe('Aluksi', function() {
        it('Lisää-nappi on disabloitu', function() {
          expect(addOppija.isEnabled()).to.equal(false)
        })
        it('Tutkinto-kenttä on disabloitu', function() {
          expect(addOppija.tutkintoIsEnabled()).to.equal(false)
        })
      })

      describe('Kun syötetään validit tiedot', function() {
        before(addOppija.enterValidData())

        describe('Käyttöliittymän tila', function() {
          it('Lisää-nappi on enabloitu', function() {
            expect(addOppija.isEnabled()).to.equal(true)
          })
        })

        describe('Kun painetaan Lisää-nappia', function() {
          before(addOppija.submit)
          before(wait.until(function() { return page.getSelectedOppija() === 'Oppija, Ossi Olavi 300994-9694'}))

          it('lisätty oppija näytetään', function() {})

          it('Lisätty opintooikeus näytetään', function() {
            expect(opinnot.getTutkinto()).to.equal('Autoalan perustutkinto')
            expect(opinnot.getOppilaitos()).to.equal('Helsingin Ammattioppilaitos')
          })
        })
      })

      describe('Kun sessio on vanhentunut', function() {
        before( openPage('/tor/uusioppija'),
          addOppija.enterValidData(),
          authentication.logout,
          addOppija.submit)

        it('Siirrytään login-sivulle', wait.until(login.isVisible))
      })

      describe('Kun hetu on virheellinen', function() {
        before(
          authentication.login(),
          openPage('/tor/uusioppija'),
          addOppija.enterValidData({hetu: '123456-1234'})
        )
        it('Lisää-nappi on disabloitu', function() {
          expect(addOppija.isEnabled()).to.equal(false)
        })
      })
      describe('Kun hetu sisältää väärän tarkistusmerkin', function() {
        before(
          addOppija.enterValidData({hetu: '011095-953Z'})
        )
        it('Lisää-nappi on disabloitu', function() {
          expect(addOppija.isEnabled()).to.equal(false)
        })
      })
      describe('Kun hetu sisältää väärän päivämäärän, mutta on muuten validi', function() {
        before(
          addOppija.enterValidData({hetu: '300275-5557'})
        )
        it('Lisää-nappi on disabloitu', function() {
          expect(addOppija.isEnabled()).to.equal(false)
        })
      })
      describe('Kun kutsumanimi ei löydy etunimistä', function() {
        before(
          addOppija.enterValidData({kutsumanimi: 'eiloydy'})
        )
        it('Lisää-nappi on disabloitu', function() {
          expect(addOppija.isEnabled()).to.equal(false)
        })
        it('Näytetään virheilmoitus', function() {
          expect(addOppija.isErrorShown('kutsumanimi')()).to.equal(true)
        })
      })
      describe('Kun kutsumanimi löytyy väliviivallisesta nimestä', function() {
        before(
          addOppija.enterValidData({etunimet: 'Juha-Pekka', kutsumanimi: 'Pekka'})
        )
        it('Lisää-nappi on enabloitu', function() {
          expect(addOppija.isEnabled()).to.equal(true)
        })
      })
      describe('Kun oppilaitos on valittu', function() {
        before(addOppija.enterValidData())
        it('voidaan valita tutkinto', function(){
          expect(addOppija.tutkintoIsEnabled()).to.equal(true)
          expect(addOppija.isEnabled()).to.equal(true)
        })
        describe('Kun oppilaitos-valinta muutetaan', function() {
          before(addOppija.selectOppilaitos('Omnia'))
          it('tutkinto pitää valita uudestaan', function() {
            expect(addOppija.isEnabled()).to.equal(false)
          })
          describe('Tutkinnon valinnan jälkeen', function() {
            before(addOppija.selectTutkinto('auto'))
            it('Lisää nappi on enabloitu', function() {
              expect(addOppija.isEnabled()).to.equal(true)
            })
          })
        })
      })
      describe('Oppilaitosvalinta', function() {
        describe('Näytetään vain käyttäjän organisaatiopuuhun kuuluvat oppilaitokset', function() {
          it('1', function() {
            return prepareForNewOppija('hiiri', 'Tunkkila')()
              .then(addOppija.enterOppilaitos('Helsinki'))
              .then(wait.forMilliseconds(500))
              .then(function() {
                expect(addOppija.oppilaitokset()).to.deep.equal(['Omnia Helsinki'])
              })
          })
          it('2', function() {
            return prepareForNewOppija('kalle', 'Tunkkila')()
              .then(addOppija.enterOppilaitos('Helsinki'))
              .then(wait.forMilliseconds(500))
              .then(function() {
                expect(addOppija.oppilaitokset()).to.deep.equal(['Metropolia Helsinki', 'Omnia Helsinki'])
              })
          })
        })
        describe('Kun oppilaitos on virheellinen', function() {
          before(addOppija.enterValidData(), addOppija.enterOppilaitos('virheellinen'))
          it('Lisää-nappi on disabloitu', function() {
            expect(addOppija.isEnabled()).to.equal(false)
          })
          it('Tutkinnon valinta on estetty', function() {
            expect(addOppija.tutkintoIsEnabled()).to.equal(false)
          })
        })
      })
      describe('Kun tutkinto on virheellinen', function() {
        before(addOppija.enterValidData(), addOppija.enterTutkinto('virheellinen'))
        it('Lisää-nappi on disabloitu', function() {
          expect(addOppija.isEnabled()).to.equal(false)
        })
      })
    })
  })


  describe('Tutkinnon rakenne', function() {
    describe('Kun valitaan osaamisala ja suoritustapa', function() {
      before(addNewOppija('kalle', 'Tunkkila', { hetu: '091095-9833'}))
      before(opinnot.selectSuoritustapa("ops"), opinnot.selectOsaamisala("1527"))

      it('Näytetään tutkinnon rakenne', function() {
        expect(opinnot.getTutkinnonOsat()[0]).to.equal('Myynti ja tuotetuntemus')
      })

      it('Muuttuneet tiedot tallennetaan', function() {
        return page.oppijaHaku.search('ero', 4)()
          .then(page.oppijaHaku.selectOppija('tunkkila'))
          .then(function() {
            expect(opinnot.getTutkinnonOsat()[0]).to.equal('Myynti ja tuotetuntemus')
          })
      })
    })
  })

  describe('Navigointi suoraan oppijan sivulle', function() {
    before(authentication.login())
    before(openPage('/tor/oppija/1.2.246.562.24.00000000001', page.isOppijaSelected('eero')))

    it('Oppijan tiedot näytetään', function() {
      expect(page.getSelectedOppija()).to.equal(eero)
    })

    it('Oppijan tutkinto ja oppilaitos näytetään', function() {
      expect(opinnot.getTutkinto()).to.equal('Autoalan perustutkinto')
      expect(opinnot.getOppilaitos()).to.equal('Helsingin Ammattioppilaitos')
    })

    it('Hakutulos näytetään', function() {
      expect(page.oppijaHaku.getSearchResults()).to.deep.equal([eero])
    })
  })

  describe('Virhetilanteet', function() {
    describe('Odottamattoman virheen sattuessa', function() {
      before(
        authentication.login(),
        resetMocks,
        page.openPage,
        page.oppijaHaku.search('error', page.isErrorShown))

      it('näytetään virheilmoitus', function() {})
    })

    describe('Kun sivua ei löydy', function() {
      before(authentication.login(), openPage('/tor/asdf', page.is404))

      it('näytetään 404-sivu', function() {})
    })
  })

  describe('Käyttöoikeudet', function() {
    describe('Oppijahaku', function() {
      before(authentication.login('hiiri'), page.openPage, page.oppijaHaku.search('eero', [markkanen]))

      it('Näytetään vain ne oppijat, joiden opinto-oikeuksiin liittyviin organisaatioihin on käyttöoikeudet', function() {

      })
    })

    describe('Navigointi oppijan sivulle', function() {
      before(authentication.login('hiiri'), openPage('/tor/oppija/1.2.246.562.24.00000000002', page.is404))

      it('Estetään jos oppijalla ei opinto-oikeutta, joihin käyttäjällä on katseluoikeudet', function() {

      })
    })

    describe('Tietojen validointi serverillä', function() {
      before(resetMocks, authentication.login('kalle'), page.openPage)

      function verifyResponseCode(data, code) {
        return function(done) {
          addOppija.postOppijaAjax(data).catch(function(error) {
            expect(error.status).to.equal(code)
            done()
          })
        }
      }

      describe('Valideilla tiedoilla', function() {
        it('palautetaan HTTP 200', verifyResponseCode({}, 200))
      })

      describe('Kun opinto-oikeutta yritetään lisätä oppilaitokseen, johon käyttäjällä ei ole pääsyä', function() {
        it('palautetaan HTTP 403 virhe', verifyResponseCode({ 'opintoOikeudet': [{ 'oppilaitosOrganisaatio':{oid: 'eipaasya'}, tutkinto: {'ePerusteetDiaarinumero':'39/011/2014', tutkintoKoodi: '351301'}}]}, 403))
      })

      describe('Kun yritetään lisätä opinto-oikeus virheelliseen perusteeseen', function() {
        it('palautetaan HTTP 400 virhe', verifyResponseCode({ 'opintoOikeudet': [{ 'oppilaitosOrganisaatio':{oid: '1'}, tutkinto: {'ePerusteetDiaarinumero':'virheellinen', tutkintoKoodi: '351301'}}]}, 400))
      })
    })
  })

  describe('Tietoturva', function() {
    before(login.openPage)

    describe('Oppijarajapinta', function() {
      before(openPage('/tor/api/oppija?query=eero', authenticationErrorIsShown))

      it('vaatii autentikaation', function () {
        expect(authenticationErrorIsShown()).to.equal(true)
      })
    })


    describe('Kun klikataan logout-linkkiä', function() {
      before(authentication.login(), page.openPage, page.logout)

      it('Siirrytään login-sivulle', function() {
        expect(login.isVisible()).to.equal(true)
      })

      describe('Kun ladataan sivu uudelleen', function() {
        before(openPage('/tor', login.isVisible))

        it('Sessio on päättynyt ja login-sivu näytetään', function() {
          expect(login.isVisible()).to.equal(true)
        })
      })

      describe('Kun kirjaudutaan uudelleen sisään', function() {
        before(authentication.login(), page.openPage, page.oppijaHaku.search('jouni', [eerola]), page.logout, login.login('kalle', 'asdf'), wait.until(page.isReady))
        it ('Käyttöliittymä on palautunut alkutilaan', function() {
          expect(page.oppijaHaku.getSearchResults()).to.deep.equal([])
          expect(page.getSelectedOppija()).to.equal('')
        })
      })
    })

    describe('Session vanhennuttua', function() {
      before(authentication.login(), page.openPage, authentication.logout, page.oppijaHaku.search('eero', login.isVisible))

      it('Siirrytään login-sivulle', function() {
        expect(login.isVisible()).to.equal(true)
      })
    })
  })
})

function authenticationErrorIsShown() {
  return S('body').text() === 'Not authenticated'
}

function resetMocks() {
  return Q($.ajax({ url: '/tor/fixtures/reset', method: 'post'}))
}